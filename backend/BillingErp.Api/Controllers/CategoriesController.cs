using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/categories/route.ts and [id]/route.ts. All data access via sp_Category_*.
// Permission module is PRODUCTS (categories are part of product catalog management), matching the
// original route's authorize("PRODUCTS", ...) calls.
[ApiController]
[Route("api/categories")]
public class CategoriesController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record CategoryRow(
        int Id, string Name, string? Description, bool Status, DateTime CreatedAt, int ProductCount);

    private static object ToResponse(CategoryRow r) => new
    {
        id = r.Id,
        name = r.Name,
        description = r.Description,
        status = r.Status,
        createdAt = r.CreatedAt,
        _count = new { products = r.ProductCount },
    };

    [HttpGet]
    [RequirePermission("PRODUCTS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<CategoryRow>("dbo.sp_Category_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToResponse));
    }

    [HttpPost]
    [RequirePermission("PRODUCTS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] CategoryCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Category name is required" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("Description", body.Description);
        parameters.Add("Status", body.Status ?? true);
        parameters.Add("CategoryId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Category_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("CategoryId");

        var created = await connection.QuerySingleAsync<CategoryRow>(
            "dbo.sp_Category_GetById", new { CategoryId = newId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "PRODUCTS", created.Id, created.Name);

        return StatusCode(201, ToResponse(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("PRODUCTS", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] CategoryUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        await connection.ExecuteAsync("dbo.sp_Category_Update", new
        {
            CategoryId = id,
            body.Name,
            body.Description,
            StatusProvided = body.Status.HasValue,
            Status = body.Status ?? false,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<CategoryRow>(
            "dbo.sp_Category_GetById", new { CategoryId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Category not found" });

        await audit.LogAsync(session.UserId, "UPDATE", "PRODUCTS", updated.Id, updated.Name);

        return Ok(ToResponse(updated));
    }

    [HttpDelete("{id:int}")]
    [RequirePermission("PRODUCTS", "DELETE")]
    public async Task<IActionResult> Delete(int id)
    {
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("CategoryId", id);
        parameters.Add("CategoryName", dbType: DbType.String, direction: ParameterDirection.Output, size: 200);
        parameters.Add("ProductCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Category_Delete", parameters, commandType: CommandType.StoredProcedure);

        var name = parameters.Get<string?>("CategoryName");
        var productCount = parameters.Get<int>("ProductCount");
        if (name is null) return NotFound(new { error = "Category not found" });

        if (productCount > 0)
        {
            return BadRequest(new { error = $"Cannot delete: {productCount} product(s) use this category." });
        }

        await audit.LogAsync(session.UserId, "DELETE", "PRODUCTS", id, name);

        return Ok(new { ok = true });
    }
}
