using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/customers/route.ts and [id]/route.ts (List/Create/Update/Delete only — the
// /ledger sub-route is out of scope, handled elsewhere). All data access via sp_Customer_*.
[ApiController]
[Route("api/customers")]
public class CustomersController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record CustomerListRow(
        int Id, string Name, string Mobile, string? Email, string? Address, string? City, string? State,
        string? Pincode, string? Gstin, string? Pan, decimal OpeningBalance, decimal? CreditLimit,
        string? PaymentTerms, string? Notes, bool Status, DateTime CreatedAt,
        decimal TotalSales, decimal Paid, decimal Due);

    private record CustomerRow(
        int Id, string Name, string Mobile, string? Email, string? Address, string? City, string? State,
        string? Pincode, string? Gstin, string? Pan, decimal OpeningBalance, decimal? CreditLimit,
        string? PaymentTerms, string? Notes, bool Status, DateTime CreatedAt);

    private static object ToListResponse(CustomerListRow r) => new
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
        paymentTerms = r.PaymentTerms,
        notes = r.Notes,
        status = r.Status,
        createdAt = r.CreatedAt,
        totalSales = r.TotalSales,
        paid = r.Paid,
        due = r.Due,
    };

    private static object ToResponse(CustomerRow r) => new
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
        paymentTerms = r.PaymentTerms,
        notes = r.Notes,
        status = r.Status,
        createdAt = r.CreatedAt,
    };

    [HttpGet]
    [RequirePermission("CUSTOMERS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<CustomerListRow>("dbo.sp_Customer_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToListResponse));
    }

    [HttpPost]
    [RequirePermission("CUSTOMERS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] CustomerCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Customer name is required" });
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
        parameters.Add("PaymentTerms", body.PaymentTerms);
        parameters.Add("Notes", body.Notes);
        parameters.Add("Status", body.Status ?? true);
        parameters.Add("CustomerId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Customer_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("CustomerId");

        var created = await connection.QuerySingleAsync<CustomerRow>(
            "dbo.sp_Customer_GetById", new { CustomerId = newId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "CUSTOMERS", created.Id, created.Name);

        return StatusCode(201, ToResponse(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("CUSTOMERS", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] CustomerUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        await connection.ExecuteAsync("dbo.sp_Customer_Update", new
        {
            CustomerId = id,
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
            body.PaymentTerms,
            body.Notes,
            StatusProvided = body.Status.HasValue,
            Status = body.Status ?? false,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<CustomerRow>(
            "dbo.sp_Customer_GetById", new { CustomerId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Customer not found" });

        await audit.LogAsync(session.UserId, "UPDATE", "CUSTOMERS", updated.Id, updated.Name);

        return Ok(ToResponse(updated));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("CUSTOMERS", "DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("CustomerId", id);
        parameters.Add("Deactivated", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("CustomerName", dbType: DbType.String, direction: ParameterDirection.Output, size: 200);

        await connection.ExecuteAsync("dbo.sp_Customer_Delete", parameters, commandType: CommandType.StoredProcedure);

        var deactivated = parameters.Get<bool>("Deactivated");
        var name = parameters.Get<string?>("CustomerName");
        if (name is null) return NotFound(new { error = "Customer not found" });

        await audit.LogAsync(session.UserId, deactivated ? "DEACTIVATE" : "DELETE", "CUSTOMERS", id, name);

        return Ok(new { ok = true, deactivated });
    }

    private record LedgerRow(DateTime Date, string Reference, decimal Amount);

    // Ports src/app/api/customers/[id]/ledger/route.ts.
    [HttpGet("{id:int}/ledger")]
    [RequirePermission("CUSTOMERS", "VIEW")]
    public async Task<IActionResult> Ledger(int id)
    {
        using var connection = connectionFactory.Create();
        var customer = await connection.QuerySingleOrDefaultAsync<CustomerRow>(
            "dbo.sp_Customer_GetById", new { CustomerId = id }, commandType: CommandType.StoredProcedure);
        if (customer is null) return NotFound(new { error = "Customer not found" });

        using var multi = await connection.QueryMultipleAsync("dbo.sp_Customer_Ledger", new { CustomerId = id }, commandType: CommandType.StoredProcedure);
        var sales = (await multi.ReadAsync<LedgerRow>()).ToList();
        var payments = (await multi.ReadAsync<LedgerRow>()).ToList();
        var returns = (await multi.ReadAsync<LedgerRow>()).ToList();

        var entries = sales.Select(s => (s.Date, Type: "Sale", s.Reference, Debit: s.Amount, Credit: 0m))
            .Concat(payments.Select(p => (p.Date, Type: "Payment Received", p.Reference, Debit: 0m, Credit: p.Amount)))
            .Concat(returns.Select(r => (r.Date, Type: "Sale Return", r.Reference, Debit: 0m, Credit: r.Amount)));

        var ledger = LedgerHelper.WithRunningBalance(entries, customer.OpeningBalance, (d, c) => d - c);
        var balance = ledger.Count > 0 ? ledger[^1].Balance : customer.OpeningBalance;
        var totalSales = sales.Sum(s => s.Amount);
        var totalPaid = payments.Sum(p => p.Amount);

        return Ok(new
        {
            customer = ToResponse(customer),
            ledger = ledger.Select(e => new { date = e.Date, type = e.Type, reference = e.Reference, debit = e.Debit, credit = e.Credit, balance = e.Balance }),
            totals = new { totalSales, totalPaid, totalDue = balance },
        });
    }
}
