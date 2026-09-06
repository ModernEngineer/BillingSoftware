using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/suppliers/route.ts and [id]/route.ts (List/Create/Update/Delete only — the
// /ledger sub-route is out of scope, handled elsewhere). All data access via sp_Supplier_*.
[ApiController]
[Route("api/suppliers")]
public class SuppliersController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record SupplierListRow(
        int Id, string Name, string Mobile, string? Email, string? Address, string? City, string? State,
        string? Pincode, string? Gstin, string? Pan, decimal OpeningBalance, decimal? CreditLimit,
        string? Notes, bool Status, DateTime CreatedAt,
        decimal TotalPurchase, decimal Paid, decimal Due);

    private record SupplierRow(
        int Id, string Name, string Mobile, string? Email, string? Address, string? City, string? State,
        string? Pincode, string? Gstin, string? Pan, decimal OpeningBalance, decimal? CreditLimit,
        string? Notes, bool Status, DateTime CreatedAt);

    private static object ToListResponse(SupplierListRow r) => new
    {
        id = r.Id,
        name = r.Name,
        mobile = r.Mobile,
        email = r.Email,
        address = r.Address,
        city = r.City,
        state = r.State,
        pincode = r.Pincode,
        gstin = r.Gstin,
        pan = r.Pan,
        openingBalance = r.OpeningBalance,
        creditLimit = r.CreditLimit,
        notes = r.Notes,
        status = r.Status,
        createdAt = r.CreatedAt,
        totalPurchase = r.TotalPurchase,
        paid = r.Paid,
        due = r.Due,
    };

    private static object ToResponse(SupplierRow r) => new
    {
        id = r.Id,
        name = r.Name,
        mobile = r.Mobile,
        email = r.Email,
        address = r.Address,
        city = r.City,
        state = r.State,
        pincode = r.Pincode,
        gstin = r.Gstin,
        pan = r.Pan,
        openingBalance = r.OpeningBalance,
        creditLimit = r.CreditLimit,
        notes = r.Notes,
        status = r.Status,
        createdAt = r.CreatedAt,
    };

    [HttpGet]
    [RequirePermission("SUPPLIERS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<SupplierListRow>("dbo.sp_Supplier_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToListResponse));
    }

    [HttpPost]
    [RequirePermission("SUPPLIERS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] SupplierCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Supplier name is required" });
        if (string.IsNullOrWhiteSpace(body.Mobile)) return BadRequest(new { error = "Mobile number is required" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("Mobile", body.Mobile);
        parameters.Add("Email", body.Email);
        parameters.Add("Address", body.Address);
        parameters.Add("City", body.City);
        parameters.Add("State", body.State);
        parameters.Add("Pincode", body.Pincode);
        parameters.Add("Gstin", body.Gstin);
        parameters.Add("Pan", body.Pan);
        parameters.Add("OpeningBalance", body.OpeningBalance ?? 0);
        parameters.Add("CreditLimit", body.CreditLimit);
        parameters.Add("Notes", body.Notes);
        parameters.Add("Status", body.Status ?? true);
        parameters.Add("SupplierId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Supplier_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("SupplierId");

        var created = await connection.QuerySingleAsync<SupplierRow>(
            "dbo.sp_Supplier_GetById", new { SupplierId = newId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "SUPPLIERS", created.Id, created.Name);

        return StatusCode(201, ToResponse(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("SUPPLIERS", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] SupplierUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        await connection.ExecuteAsync("dbo.sp_Supplier_Update", new
        {
            SupplierId = id,
            body.Name,
            body.Mobile,
            body.Email,
            body.Address,
            body.City,
            body.State,
            body.Pincode,
            body.Gstin,
            body.Pan,
            OpeningBalanceProvided = body.OpeningBalance.HasValue,
            OpeningBalance = body.OpeningBalance ?? 0,
            body.CreditLimit,
            body.Notes,
            StatusProvided = body.Status.HasValue,
            Status = body.Status ?? false,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<SupplierRow>(
            "dbo.sp_Supplier_GetById", new { SupplierId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Supplier not found" });

        await audit.LogAsync(session.UserId, "UPDATE", "SUPPLIERS", updated.Id, updated.Name);

        return Ok(ToResponse(updated));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("SUPPLIERS", "DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("SupplierId", id);
        parameters.Add("Deactivated", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("SupplierName", dbType: DbType.String, direction: ParameterDirection.Output, size: 200);

        await connection.ExecuteAsync("dbo.sp_Supplier_Delete", parameters, commandType: CommandType.StoredProcedure);

        var deactivated = parameters.Get<bool>("Deactivated");
        var name = parameters.Get<string?>("SupplierName");
        if (name is null) return NotFound(new { error = "Supplier not found" });

        await audit.LogAsync(session.UserId, deactivated ? "DEACTIVATE" : "DELETE", "SUPPLIERS", id, name);

        return Ok(new { ok = true, deactivated });
    }

    private record LedgerRow(DateTime Date, string Reference, decimal Amount);

    // Ports src/app/api/suppliers/[id]/ledger/route.ts.
    [HttpGet("{id:int}/ledger")]
    [RequirePermission("SUPPLIERS", "VIEW")]
    public async Task<IActionResult> Ledger(int id)
    {
        using var connection = connectionFactory.Create();
        var supplier = await connection.QuerySingleOrDefaultAsync<SupplierRow>(
            "dbo.sp_Supplier_GetById", new { SupplierId = id }, commandType: CommandType.StoredProcedure);
        if (supplier is null) return NotFound(new { error = "Supplier not found" });

        using var multi = await connection.QueryMultipleAsync("dbo.sp_Supplier_Ledger", new { SupplierId = id }, commandType: CommandType.StoredProcedure);
        var purchases = (await multi.ReadAsync<LedgerRow>()).ToList();
        var payments = (await multi.ReadAsync<LedgerRow>()).ToList();
        var returns = (await multi.ReadAsync<LedgerRow>()).ToList();

        var entries = purchases.Select(p => (p.Date, Type: "Purchase", p.Reference, Debit: 0m, Credit: p.Amount))
            .Concat(payments.Select(p => (p.Date, Type: "Payment Made", p.Reference, Debit: p.Amount, Credit: 0m)))
            .Concat(returns.Select(r => (r.Date, Type: "Purchase Return", r.Reference, Debit: r.Amount, Credit: 0m)));

        var ledger = LedgerHelper.WithRunningBalance(entries, supplier.OpeningBalance, (d, c) => c - d);
        var balance = ledger.Count > 0 ? ledger[^1].Balance : supplier.OpeningBalance;
        var totalPurchase = purchases.Sum(p => p.Amount);
        var totalPaid = payments.Sum(p => p.Amount);

        return Ok(new
        {
            supplier = ToResponse(supplier),
            ledger = ledger.Select(e => new { date = e.Date, type = e.Type, reference = e.Reference, debit = e.Debit, credit = e.Credit, balance = e.Balance }),
            totals = new { totalPurchase, totalPaid, totalDue = balance },
        });
    }
}
