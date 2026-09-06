using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/products/route.ts and [id]/route.ts. All data access via sp_Product_*.
[ApiController]
[Route("api/products")]
public class ProductsController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record ProductRow(
        int Id, string Name, string Sku, string? Barcode,
        int? CategoryId, string? CategoryName,
        int? BrandId, string? BrandName, bool? BrandStatus,
        int UnitId, string UnitName, string? UnitShortName,
        string? HsnCode, decimal PurchasePrice, decimal SellingPrice, decimal? Mrp, decimal GstRate,
        decimal OpeningStock, decimal MinimumStock, decimal? MaximumStock,
        string? Description, string? Image, bool Status,
        DateTime CreatedAt, DateTime UpdatedAt, decimal CurrentStock);

    private static object ToResponse(ProductRow r) => new
    {
        id = r.Id,
        name = r.Name,
        sku = r.Sku,
        barcode = r.Barcode,
        categoryId = r.CategoryId,
        category = r.CategoryId is null ? null : new { id = r.CategoryId, name = r.CategoryName },
        brandId = r.BrandId,
        brand = r.BrandId is null ? null : new { id = r.BrandId, name = r.BrandName, status = r.BrandStatus },
        unitId = r.UnitId,
        unit = new { id = r.UnitId, name = r.UnitName, shortName = r.UnitShortName },
        hsnCode = r.HsnCode,
        purchasePrice = r.PurchasePrice,
        sellingPrice = r.SellingPrice,
        mrp = r.Mrp,
        gstRate = r.GstRate,
        openingStock = r.OpeningStock,
        minimumStock = r.MinimumStock,
        maximumStock = r.MaximumStock,
        description = r.Description,
        image = r.Image,
        status = r.Status,
        createdAt = r.CreatedAt,
        updatedAt = r.UpdatedAt,
        currentStock = r.CurrentStock,
    };

    [HttpGet]
    [RequirePermission("PRODUCTS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<ProductRow>("dbo.sp_Product_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(ToResponse));
    }

    [HttpGet("{id:int}")]
    [RequirePermission("PRODUCTS", "VIEW")]
    public async Task<IActionResult> GetById(int id)
    {
        using var connection = connectionFactory.Create();
        var row = await connection.QuerySingleOrDefaultAsync<ProductRow>(
            "dbo.sp_Product_GetById", new { ProductId = id }, commandType: CommandType.StoredProcedure);
        if (row is null) return NotFound(new { error = "Product not found" });
        return Ok(ToResponse(row));
    }

    [HttpPost]
    [RequirePermission("PRODUCTS", "CREATE")]
    public async Task<IActionResult> Create([FromBody] ProductCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Name)) return BadRequest(new { error = "Product name is required" });
        if (string.IsNullOrWhiteSpace(body.Sku)) return BadRequest(new { error = "SKU is required" });
        if (body.UnitId <= 0) return BadRequest(new { error = "Unit is required" });
        if (body.PurchasePrice < 0 || body.SellingPrice < 0) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var skuExists = await connection.ExecuteScalarAsync<bool>(
            "dbo.sp_Product_SkuExists", new { Sku = body.Sku }, commandType: CommandType.StoredProcedure);
        if (skuExists) return BadRequest(new { error = "A product with this SKU already exists." });

        var parameters = new DynamicParameters();
        parameters.Add("Name", body.Name);
        parameters.Add("Sku", body.Sku);
        parameters.Add("Barcode", body.Barcode);
        parameters.Add("CategoryId", body.CategoryId);
        parameters.Add("BrandId", body.BrandId);
        parameters.Add("UnitId", body.UnitId);
        parameters.Add("HsnCode", body.HsnCode);
        parameters.Add("PurchasePrice", body.PurchasePrice);
        parameters.Add("SellingPrice", body.SellingPrice);
        parameters.Add("Mrp", body.Mrp);
        parameters.Add("GstRate", body.GstRate ?? 0);
        parameters.Add("OpeningStock", body.OpeningStock ?? 0);
        parameters.Add("MinimumStock", body.MinimumStock ?? 0);
        parameters.Add("MaximumStock", body.MaximumStock);
        parameters.Add("Description", body.Description);
        parameters.Add("Image", body.Image);
        parameters.Add("Status", body.Status ?? true);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("ProductId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Product_Create", parameters, commandType: CommandType.StoredProcedure);
        var newId = parameters.Get<int>("ProductId");

        var created = await connection.QuerySingleAsync<ProductRow>(
            "dbo.sp_Product_GetById", new { ProductId = newId }, commandType: CommandType.StoredProcedure);

        await audit.LogAsync(session.UserId, "CREATE", "PRODUCTS", created.Id, created.Name);

        return StatusCode(201, ToResponse(created));
    }

    [HttpPatch("{id:int}")]
    [RequirePermission("PRODUCTS", "EDIT")]
    public async Task<IActionResult> Update(int id, [FromBody] ProductUpdateRequest? body)
    {
        if (body is null) return BadRequest(new { error = "Invalid input" });
        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        if (!string.IsNullOrEmpty(body.Sku))
        {
            var skuExists = await connection.ExecuteScalarAsync<bool>(
                "dbo.sp_Product_SkuExists", new { Sku = body.Sku, ExcludeProductId = id }, commandType: CommandType.StoredProcedure);
            if (skuExists) return BadRequest(new { error = "A product with this SKU already exists." });
        }

        await connection.ExecuteAsync("dbo.sp_Product_Update", new
        {
            ProductId = id,
            body.Name,
            body.Sku,
            body.Barcode,
            body.CategoryId,
            body.BrandId,
            body.UnitId,
            body.HsnCode,
            body.PurchasePrice,
            body.SellingPrice,
            body.Mrp,
            body.GstRate,
            body.MinimumStock,
            body.MaximumStock,
            body.Description,
            body.Image,
            StatusProvided = body.Status.HasValue,
            Status = body.Status ?? false,
        }, commandType: CommandType.StoredProcedure);

        var updated = await connection.QuerySingleOrDefaultAsync<ProductRow>(
            "dbo.sp_Product_GetById", new { ProductId = id }, commandType: CommandType.StoredProcedure);
        if (updated is null) return NotFound(new { error = "Product not found" });

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
        parameters.Add("ProductId", id);
        parameters.Add("Deactivated", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("ProductName", dbType: DbType.String, direction: ParameterDirection.Output, size: 200);

        await connection.ExecuteAsync("dbo.sp_Product_Delete", parameters, commandType: CommandType.StoredProcedure);

        var deactivated = parameters.Get<bool>("Deactivated");
        var name = parameters.Get<string?>("ProductName");
        if (name is null) return NotFound(new { error = "Product not found" });

        await audit.LogAsync(session.UserId, deactivated ? "DEACTIVATE" : "DELETE", "PRODUCTS", id, name);

        return Ok(new { ok = true, deactivated });
    }
}
