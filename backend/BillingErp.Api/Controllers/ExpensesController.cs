using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/expenses/route.ts and [id]/route.ts.
[ApiController]
[Route("api/expenses")]
public class ExpensesController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record ExpenseRow(
        int Id, int CategoryId, string CategoryName, string? CategoryDescription, bool CategoryStatus,
        decimal Amount, DateTime Date, string PaymentMethod, string? Description, string? Attachment,
        int CreatedById, string CreatedByName, DateTime CreatedAt);

    private static object ToJson(ExpenseRow r) => new
    {
        id = r.Id,
        categoryId = r.CategoryId,
        category = new { id = r.CategoryId, name = r.CategoryName, description = r.CategoryDescription, status = r.CategoryStatus },
        amount = r.Amount,
        date = r.Date,
        paymentMethod = r.PaymentMethod,
        description = r.Description,
        attachment = r.Attachment,
        createdById = r.CreatedById,
        createdBy = new { name = r.CreatedByName },
        createdAt = r.CreatedAt,
    };

    [HttpGet]
    [RequirePermission("EXPENSES", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<ExpenseRow>("dbo.sp_Expense_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToJson));
    }

    [HttpPost]
    [RequirePermission("EXPENSES", "CREATE")]
    public async Task<IActionResult> Create([FromBody] ExpenseCreateRequest? body)
    {
        if (body is null || body.Amount <= 0) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("CategoryId", body.CategoryId);
        parameters.Add("Amount", body.Amount);
        parameters.Add("Date", body.Date);
        parameters.Add("PaymentMethod", body.PaymentMethod);
        parameters.Add("Description", body.Description);
        parameters.Add("Attachment", body.Attachment);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("ExpenseId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Expense_Create", parameters, commandType: CommandType.StoredProcedure);
        var expenseId = parameters.Get<int>("ExpenseId");

        var created = await connection.QuerySingleAsync<ExpenseRow>(
            "dbo.sp_Expense_GetById", new { ExpenseId = expenseId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "EXPENSES", created.Id, created.CategoryName);

        return StatusCode(201, ToJson(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("EXPENSES", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] ExpenseUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        await connection.ExecuteAsync("dbo.sp_Expense_Update", new
        {
            ExpenseId = id,
            body.CategoryId,
            body.Amount,
            body.Date,
            body.PaymentMethod,
            DescriptionProvided = body.Description is not null,
            body.Description,
            AttachmentProvided = body.Attachment is not null,
            body.Attachment,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<ExpenseRow>(
            "dbo.sp_Expense_GetById", new { ExpenseId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Expense not found" });

        await audit.LogAsync(session.UserId, "UPDATE", "EXPENSES", updated.Id);

        return Ok(ToJson(updated));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("EXPENSES", "DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var rowsDeleted = await connection.ExecuteScalarAsync<int>(
            "dbo.sp_Expense_Delete", new { ExpenseId = id }, commandType: CommandType.StoredProcedure);
        if (rowsDeleted == 0) return NotFound(new { error = "Expense not found" });

        await audit.LogAsync(session.UserId, "DELETE", "EXPENSES", id);

        return Ok(new { ok = true });
    }
}
