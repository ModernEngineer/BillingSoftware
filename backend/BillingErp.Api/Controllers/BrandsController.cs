using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/brands/route.ts. There is no [id]/route.ts in the original app — Brand only
// has GET (list) and POST (create); no PATCH/DELETE endpoints exist to port, so none are added
// here. No logAudit call either — the original POST route doesn't call logAudit for brands.
[ApiController]
[Route("api/brands")]
public class BrandsController(SqlConnectionFactory connectionFactory) : ControllerBase
{
    private record BrandRow(int Id, string Name, bool Status);

    private static object ToResponse(BrandRow r) => new
    {
        id = r.Id,
        name = r.Name,
        status = r.Status,
    };

    [HttpGet]
    [RequirePermission("PRODUCTS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<BrandRow>("dbo.sp_Brand_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToResponse));
    }

    [HttpPost]
    [RequirePermission("PRODUCTS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] BrandCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Brand name is required" });

        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("BrandId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Brand_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("BrandId");

        var created = await connection.QuerySingleAsync<BrandRow>(
            "dbo.sp_Brand_GetById", new { BrandId = newId }, commandType: CommandType.StoredProcedure);

        return StatusCode(201, ToResponse(created));
    }
}
