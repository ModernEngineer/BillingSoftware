using System.IdentityModel.Tokens.Jwt;
using System.Text;
using Microsoft.IdentityModel.Tokens;

namespace BillingErp.Api.Auth;

// Ports src/lib/jwt.ts. Must stay byte-for-byte claim-compatible with jose's
// signSession()/verifySessionToken() — same secret, same HS256 alg, same flat claim names —
// because src/middleware.ts (unmodified) verifies this cookie with jose on every page request.
public class TokenService(IConfiguration config)
{
    public const string CookieName = "billing_session";
    public const int TtlSeconds = 60 * 60 * 24 * 7; // 7 days

    private SymmetricSecurityKey GetKey()
    {
        var secret = config["Jwt:Secret"];
        if (string.IsNullOrEmpty(secret)) throw new InvalidOperationException("Jwt:Secret is not configured");
        return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
    }

    public string CreateToken(SessionPayload session)
    {
        var now = DateTimeOffset.UtcNow;
        var payload = new JwtPayload
        {
            { "userId", session.UserId },
            { "name", session.Name },
            { "email", session.Email },
            { "roleId", session.RoleId },
            { "roleName", session.RoleName },
            { "iat", now.ToUnixTimeSeconds() },
            { "exp", now.AddSeconds(TtlSeconds).ToUnixTimeSeconds() },
        };
        var header = new JwtHeader(new SigningCredentials(GetKey(), SecurityAlgorithms.HmacSha256));
        var token = new JwtSecurityToken(header, payload);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public SessionPayload? ValidateToken(string token)
    {
        // InboundClaimTypeMap defaults to remapping short claim names (e.g. "email") to long
        // legacy XML/WS-* URIs on the way in — clearing it keeps claim names exactly as issued
        // ("userId", "roleId", ...), matching how they were written above.
        var handler = new JwtSecurityTokenHandler { InboundClaimTypeMap = new Dictionary<string, string>() };
        var parameters = new TokenValidationParameters
        {
            ValidateIssuer = false,
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = GetKey(),
        };
        try
        {
            var principal = handler.ValidateToken(token, parameters, out _);
            var userId = int.Parse(principal.FindFirst("userId")!.Value);
            var name = principal.FindFirst("name")!.Value;
            var email = principal.FindFirst("email")!.Value;
            var roleId = int.Parse(principal.FindFirst("roleId")!.Value);
            var roleName = principal.FindFirst("roleName")!.Value;
            return new SessionPayload(userId, name, email, roleId, roleName);
        }
        catch
        {
            return null;
        }
    }
}
