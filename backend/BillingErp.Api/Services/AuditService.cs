using System.Data;
using BillingErp.Api.Data;
using Dapper;

namespace BillingErp.Api.Services;

// Ports src/lib/audit.ts — backed by sp_Audit_Log. Intentionally called after the main business
// transaction commits (own connection, not the caller's), preserving the original's
// fire-and-forget-after-commit behavior.
public class AuditService(SqlConnectionFactory connectionFactory)
{
    public async Task LogAsync(int? userId, string action, string module, int? recordId = null, string? recordLabel = null, string? ipAddress = null)
    {
        using var connection = connectionFactory.Create();
        await connection.ExecuteAsync(
            "dbo.sp_Audit_Log",
            new { UserId = userId, Action = action, Module = module, RecordId = recordId, RecordLabel = recordLabel, IpAddress = ipAddress },
            commandType: CommandType.StoredProcedure);
    }
}
