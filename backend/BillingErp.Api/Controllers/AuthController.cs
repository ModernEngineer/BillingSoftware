using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/auth/{login,logout,me,profile}/route.ts. All data access via sp_Auth_*.
[ApiController]
[Route("api/auth")]
public class AuthController(
    SqlConnectionFactory connectionFactory,
    TokenService tokenService,
    AuditService audit,
    IWebHostEnvironment env,
    IPermissionService permissions) : ControllerBase
{
    private record UserRow(int Id, string Name, string Email, string Password, string? Mobile, int RoleId, string RoleName, bool Status);

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest? body)
    {
        if (string.IsNullOrWhiteSpace(body?.Email)) return BadRequest(new { error = "Email or username is required" });
        if (string.IsNullOrWhiteSpace(body.Password)) return BadRequest(new { error = "Password is required" });

        var email = body.Email.Trim().ToLowerInvariant();
        using var connection = connectionFactory.Create();
        var user = await connection.QuerySingleOrDefaultAsync<UserRow>(
            "dbo.sp_Auth_GetUserByEmail", new { Email = email }, commandType: CommandType.StoredProcedure);

        if (user is null || !user.Status) return Unauthorized(new { error = "Invalid email or password" });
        if (!PasswordHasher.Verify(body.Password, user.Password)) return Unauthorized(new { error = "Invalid email or password" });

        var session = new SessionPayload(user.Id, user.Name, user.Email, user.RoleId, user.RoleName);
        SetSessionCookie(session);

        await connection.ExecuteAsync("dbo.sp_Auth_UpdateLastLogin", new { UserId = user.Id }, commandType: CommandType.StoredProcedure);

        var ip = Request.Headers["X-Forwarded-For"].ToString();
        await audit.LogAsync(user.Id, "LOGIN", "AUTH", user.Id, user.Email, string.IsNullOrEmpty(ip) ? null : ip);

        return Ok(new { user = new { id = user.Id, name = user.Name, email = user.Email, role = user.RoleName } });
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        var session = HttpContext.GetSession();
        if (session is not null)
        {
            await audit.LogAsync(session.UserId, "LOGOUT", "AUTH", session.UserId, session.Email);
        }
        Response.Cookies.Delete(TokenService.CookieName, new CookieOptions { Path = "/" });
        return Ok(new { ok = true });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var session = HttpContext.GetSession();
        if (session is null) return Unauthorized(new { error = "Unauthorized" });
        var perms = await permissions.GetRolePermissionsAsync(session.RoleId);
        return Ok(new { session, permissions = perms });
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var session = HttpContext.GetSession();
        if (session is null) return Unauthorized(new { error = "Unauthorized" });

        using var connection = connectionFactory.Create();
        var user = await connection.QuerySingleOrDefaultAsync<UserRow>(
            "dbo.sp_Auth_GetUserById", new { UserId = session.UserId }, commandType: CommandType.StoredProcedure);
        if (user is null) return NotFound(new { error = "User not found" });

        return Ok(new { id = user.Id, name = user.Name, email = user.Email, mobile = user.Mobile, role = new { name = user.RoleName } });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateRequest? body)
    {
        var session = HttpContext.GetSession();
        if (session is null) return Unauthorized(new { error = "Unauthorized" });
        if (body is null || string.IsNullOrWhiteSpace(body.CurrentPassword))
            return BadRequest(new { error = "Current password is required" });
        if (body.Name is not null && body.Name.Trim().Length == 0)
            return BadRequest(new { error = "Name is required" });
        if (body.Email is not null && !body.Email.Contains('@'))
            return BadRequest(new { error = "Invalid email address" });
        if (body.NewPassword is not null && body.NewPassword.Length < 6)
            return BadRequest(new { error = "New password must be at least 6 characters" });

        using var connection = connectionFactory.Create();
        var user = await connection.QuerySingleOrDefaultAsync<UserRow>(
            "dbo.sp_Auth_GetUserById", new { UserId = session.UserId }, commandType: CommandType.StoredProcedure);
        if (user is null) return NotFound(new { error = "User not found" });

        if (!PasswordHasher.Verify(body.CurrentPassword, user.Password))
            return BadRequest(new { error = "Current password is incorrect." });

        string? newEmail = null;
        if (!string.IsNullOrEmpty(body.Email))
        {
            newEmail = body.Email.ToLowerInvariant();
            if (newEmail != user.Email)
            {
                var exists = await connection.ExecuteScalarAsync<bool>(
                    "dbo.sp_Auth_EmailExists", new { Email = newEmail, ExcludeUserId = user.Id }, commandType: CommandType.StoredProcedure);
                if (exists) return BadRequest(new { error = "A user with this email already exists." });
            }
        }

        var passwordHash = !string.IsNullOrEmpty(body.NewPassword) ? PasswordHasher.Hash(body.NewPassword) : null;
        var mobileProvided = body.Mobile is not null;

        var updated = await connection.QuerySingleAsync<UserRow2>(
            "dbo.sp_Auth_UpdateProfile",
            new
            {
                UserId = user.Id,
                Name = string.IsNullOrEmpty(body.Name) ? null : body.Name,
                Email = newEmail,
                MobileProvided = mobileProvided,
                Mobile = body.Mobile,
                PasswordHash = passwordHash,
            },
            commandType: CommandType.StoredProcedure);

        var refreshed = new SessionPayload(updated.Id, updated.Name, updated.Email, updated.RoleId, updated.RoleName);
        SetSessionCookie(refreshed);

        await audit.LogAsync(session.UserId, "UPDATE", "USERS", updated.Id, "Own profile");

        return Ok(new { id = updated.Id, name = updated.Name, email = updated.Email, mobile = updated.Mobile });
    }

    private record UserRow2(int Id, string Name, string Email, string? Mobile, int RoleId, string RoleName);

    private void SetSessionCookie(SessionPayload session)
    {
        var token = tokenService.CreateToken(session);
        Response.Cookies.Append(TokenService.CookieName, token, new CookieOptions
        {
            HttpOnly = true,
            Secure = !env.IsDevelopment(),
            SameSite = SameSiteMode.Lax,
            Path = "/",
            MaxAge = TimeSpan.FromSeconds(TokenService.TtlSeconds),
        });
    }
}
