using BillingErp.Api.Data;
using Dapper;

namespace BillingErp.Api.Services;

// Ports src/lib/permissions.ts (getRolePermissions / can) — now backed by sp_Permission_GetForRole.
public interface IPermissionService
{
    Task<Dictionary<string, List<string>>> GetRolePermissionsAsync(int roleId);
    Task<bool> CanAsync(int roleId, string module, string action);
}

public class PermissionService(SqlConnectionFactory connectionFactory) : IPermissionService
{
    private record PermissionRow(string Module, string Action);

    public async Task<Dictionary<string, List<string>>> GetRolePermissionsAsync(int roleId)
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<PermissionRow>(
            "dbo.sp_Permission_GetForRole",
            new { RoleId = roleId },
            commandType: System.Data.CommandType.StoredProcedure);

        var byModule = new Dictionary<string, List<string>>();
        foreach (var row in rows)
        {
            if (!byModule.TryGetValue(row.Module, out var actions))
            {
                actions = new List<string>();
                byModule[row.Module] = actions;
            }
            actions.Add(row.Action);
        }
        return byModule;
    }

    public async Task<bool> CanAsync(int roleId, string module, string action)
    {
        var permissions = await GetRolePermissionsAsync(roleId);
        return permissions.TryGetValue(module, out var actions) && actions.Contains(action);
    }
}
