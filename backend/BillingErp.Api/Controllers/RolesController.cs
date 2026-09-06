using System.Data;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/roles/route.ts and [id]/route.ts.
[ApiController]
[Route("api/roles")]
public class RolesController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record RoleRow(int Id, string Name, int UserCount);
    private record RolePermissionRow(int RoleId, string Module, string Action);

    [HttpGet]
    [RequirePermission("USERS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Role_List", commandType: CommandType.StoredProcedure);
        var roles = (await multi.ReadAsync<RoleRow>()).ToList();
        var permRows = (await multi.ReadAsync<RolePermissionRow>()).ToList();
        var byRole = permRows.GroupBy(p => p.RoleId).ToDictionary(g => g.Key, g => g.GroupBy(p => p.Module).ToDictionary(m => m.Key, m => m.Select(x => x.Action).ToList()));

        return Ok(roles.Select(r => new
        {
            id = r.Id,
            name = r.Name,
            userCount = r.UserCount,
            permissions = byRole.TryGetValue(r.Id, out var p) ? p : new Dictionary<string, List<string>>(),
        }));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("USERS", "EDIT")]
    public async Task<IActionResult> UpdatePermissions(int id, [FromBody] RoleUpdatePermissionsRequest? body)
    {
        if (body?.Permissions is null) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        var keys = body.Permissions.SelectMany(kv => kv.Value.Select(action => $"{kv.Key}:{action}")).ToList();
        var keysJson = JsonSerializer.Serialize(keys);

        using var connection = connectionFactory.Create();
        await connection.ExecuteAsync("dbo.sp_Role_UpdatePermissions", new { RoleId = id, PermissionKeysJson = keysJson }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "UPDATE", "USERS", id, "Role Permissions");

        return Ok(new { ok = true });
    }
}
