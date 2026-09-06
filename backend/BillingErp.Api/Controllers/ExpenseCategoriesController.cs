using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/expense-categories/route.ts. There is no [id]/route.ts in the original app —
// ExpenseCategory only has GET (list, active-only) and POST (create); no PATCH/DELETE endpoints
// exist to port. No logAudit call either — the original POST route doesn't call logAudit here.
[ApiController]
[Route("api/expense-categories")]
public class ExpenseCategoriesController(SqlConnectionFactory connectionFactory) : ControllerBase
{
    private record ExpenseCategoryRow(int Id, string Name, string? Description, bool Status);

    private static object ToResponse(ExpenseCategoryRow r) => new
    {
        id = r.Id,
        name = r.Name,
        description = r.Description,
        status = r.Status,
    };

    [HttpGet]
    [RequirePermission("EXPENSES", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<ExpenseCategoryRow>("dbo.sp_ExpenseCategory_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToResponse));
    }

    [HttpPost]
    [RequirePermission("EXPENSES", "CREATE")]
    public async Task<IActionResult> Create([FromBody] ExpenseCategoryCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Category name is required" });

        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("Description", body.Description);
        parameters.Add("ExpenseCategoryId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_ExpenseCategory_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("ExpenseCategoryId");

        var created = await connection.QuerySingleAsync<ExpenseCategoryRow>(
            "dbo.sp_ExpenseCategory_GetById", new { ExpenseCategoryId = newId }, commandType: CommandType.StoredProcedure);

        return StatusCode(201, ToResponse(created));
    }
}
