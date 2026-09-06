using System.Data;
using System.Text;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/lib/backup.ts + src/app/api/settings/backup/{export,restore}/route.ts, via the
// generic sp_Backup_ExportTable/ClearTable/ImportTable procedures (Data/StoredProcedures/).
// Note: this is a NEW backup file format (JSON keyed by this project's own SQL table names,
// e.g. "AuditLogs") — it is not cross-compatible with a backup exported from the old Next.js/
// Prisma/SQLite app, since the underlying schema and types (Float -> decimal, etc.) changed too.
[ApiController]
[Route("api/settings/backup")]
public class BackupController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    // Children-first order (safe delete order); reversed = parent-first (safe insert order).
    private static readonly string[] TablesChildToParent =
    [
        "AuditLogs", "Notifications", "ProductionConsumptions", "ProductionOrders", "BOMItems", "Payrolls",
        "Attendances", "Employees", "LeadActivities", "Leads", "Expenses", "ExpenseCategories", "StockAdjustments",
        "StockTransactions", "Payments", "PurchaseReturnItems", "PurchaseReturns", "PurchaseItems", "Purchases",
        "SaleReturnItems", "SaleReturns", "SaleItems", "Sales", "Suppliers", "Customers", "Products", "Units",
        "Brands", "Categories", "Businesses", "Users", "RolePermissions", "Permissions", "Roles",
    ];

    [HttpGet("export")]
    [RequirePermission("SETTINGS", "EXPORT")]
    public async Task<IActionResult> Export()
    {
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var data = new Dictionary<string, JsonElement>();
        foreach (var table in TablesChildToParent.Reverse()) // parent-first, matches original's export order
        {
            var parameters = new DynamicParameters();
            parameters.Add("TableName", table);
            parameters.Add("Json", dbType: DbType.String, direction: ParameterDirection.Output, size: -1);
            await connection.ExecuteAsync("dbo.sp_Backup_ExportTable", parameters, commandType: CommandType.StoredProcedure);
            var json = parameters.Get<string>("Json");
            data[table] = JsonDocument.Parse(json).RootElement.Clone();
        }

        var payload = new { exportedAt = DateTime.UtcNow, version = 1, data };
        var json2 = JsonSerializer.Serialize(payload, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase });

        await audit.LogAsync(session.UserId, "EXPORT", "SETTINGS", recordLabel: "Backup Export");

        var fileName = $"billing-erp-backup-{DateTime.UtcNow:yyyy-MM-dd}.json";
        return File(Encoding.UTF8.GetBytes(json2), "application/json", fileName);
    }

    [HttpPost("restore")]
    [RequirePermission("SETTINGS", "EDIT")]
    public async Task<IActionResult> Restore([FromBody] JsonElement body)
    {
        if (body.ValueKind != JsonValueKind.Object || !body.TryGetProperty("data", out var dataElement) || dataElement.ValueKind != JsonValueKind.Object)
            return BadRequest(new { error = "Invalid backup file." });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();
        connection.Open();
        using var transaction = connection.BeginTransaction();

        try
        {
            foreach (var table in TablesChildToParent)
            {
                await connection.ExecuteAsync(
                    "dbo.sp_Backup_ClearTable", new { TableName = table }, transaction,
                    commandTimeout: 60, commandType: CommandType.StoredProcedure);
            }

            foreach (var table in TablesChildToParent.Reverse())
            {
                if (!dataElement.TryGetProperty(table, out var rows) || rows.GetArrayLength() == 0) continue;
                var rowsJson = rows.GetRawText();
                await connection.ExecuteAsync(
                    "dbo.sp_Backup_ImportTable", new { TableName = table, RowsJson = rowsJson }, transaction,
                    commandTimeout: 60, commandType: CommandType.StoredProcedure);
            }

            transaction.Commit();
        }
        catch (Exception ex)
        {
            transaction.Rollback();
            return StatusCode(500, new { error = ex.Message });
        }

        await audit.LogAsync(session.UserId, "RESTORE", "SETTINGS", recordLabel: "Backup Restore");

        return Ok(new { ok = true });
    }
}
