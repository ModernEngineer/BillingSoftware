using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/units/route.ts and [id]/route.ts. All data access via sp_Unit_*.
[ApiController]
[Route("api/units")]
public class UnitsController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record UnitRow(int Id, string Name, string? ShortName, int ProductCount);

    private static object ToResponse(UnitRow r) => new
    {
        id = r.Id,
        name = r.Name,
        shortName = r.ShortName,
        _count = new { products = r.ProductCount },
    };

    [HttpGet]
    [RequirePermission("PRODUCTS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<UnitRow>("dbo.sp_Unit_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToResponse));
    }

    [HttpPost]
    [RequirePermission("PRODUCTS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] UnitCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Unit name is required" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var nameExists = await connection.ExecuteScalarAsync<bool>(
            "dbo.sp_Unit_NameExists", new { Name = body.Name }, commandType: CommandType.StoredProcedure);
        if (nameExists) return BadRequest(new { error = "A unit with this name already exists." });

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("ShortName", body.ShortName);
        parameters.Add("UnitId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Unit_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("UnitId");

        var created = await connection.QuerySingleAsync<UnitRow>(
            "dbo.sp_Unit_GetById", new { UnitId = newId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "PRODUCTS", created.Id, created.Name);

        return StatusCode(201, ToResponse(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("PRODUCTS", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] UnitUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        if (!string.IsNullOrEmpty(body.Name))
        {
            var nameExists = await connection.ExecuteScalarAsync<bool>(
                "dbo.sp_Unit_NameExists", new { Name = body.Name, ExcludeUnitId = id }, commandType: CommandType.StoredProcedure);
            if (nameExists) return BadRequest(new { error = "A unit with this name already exists." });
        }

        await connection.ExecuteAsync("dbo.sp_Unit_Update", new
        {
            UnitId = id,
            body.Name,
            body.ShortName,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<UnitRow>(
            "dbo.sp_Unit_GetById", new { UnitId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Unit not found" });

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
        parameters.Add("UnitId", id);
        parameters.Add("UnitName", dbType: DbType.String, direction: ParameterDirection.Output, size: 200);
        parameters.Add("ProductCount", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Unit_Delete", parameters, commandType: CommandType.StoredProcedure);

        var name = parameters.Get<string?>("UnitName");
        var productCount = parameters.Get<int>("ProductCount");
        if (name is null) return NotFound(new { error = "Unit not found" });

        if (productCount > 0)
        {
            return BadRequest(new { error = $"Cannot delete: {productCount} product(s) use this unit." });
        }

        await audit.LogAsync(session.UserId, "DELETE", "PRODUCTS", id, name);

        return Ok(new { ok = true });
    }
}
