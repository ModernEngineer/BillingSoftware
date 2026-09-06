using System.Data;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/import/{customers,suppliers,products,opening-stock}/route.ts.
// Each row is processed independently with try/continue error collection, no enclosing
// transaction across rows — matches the original's partial-success contract exactly.
[ApiController]
[Route("api/import")]
public class ImportController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private static string? GetString(Dictionary<string, JsonElement> row, string key)
    {
        if (!row.TryGetValue(key, out var el)) return null;
        return el.ValueKind switch
        {
            JsonValueKind.String => el.GetString(),
            JsonValueKind.Number => el.GetRawText(),
            _ => null,
        };
    }

    private static decimal GetDecimalOrZero(Dictionary<string, JsonElement> row, string key)
    {
        var s = GetString(row, key);
        return decimal.TryParse(s, out var d) ? d : 0;
    }

    [HttpPost("customers")]
    [RequirePermission("CUSTOMERS", "CREATE")]
    public async Task<IActionResult> ImportCustomers([FromBody] ImportRequest? body)
    {
        var session = HttpContext.GetSession()!;
        var rows = body?.Rows ?? new List<Dictionary<string, JsonElement>>();
        var errors = new List<ImportRowError>();
        var inserted = 0;

        using var connection = connectionFactory.Create();
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNum = i + 2;
            var name = (GetString(row, "Name") ?? "").Trim();
            var mobile = (GetString(row, "Mobile") ?? "").Trim();
            if (name.Length == 0) { errors.Add(new(rowNum, "Name is required")); continue; }
            if (mobile.Length == 0) { errors.Add(new(rowNum, "Mobile is required")); continue; }

            await connection.ExecuteAsync("dbo.sp_Import_Customer_Create", new
            {
                Name = name,
                Mobile = mobile,
                Email = GetString(row, "Email"),
                Address = GetString(row, "Address"),
                City = GetString(row, "City"),
                State = GetString(row, "State"),
                Pincode = GetString(row, "Pincode"),
                Gstin = GetString(row, "GSTIN"),
                OpeningBalance = GetDecimalOrZero(row, "OpeningBalance"),
            }, commandType: CommandType.StoredProcedure);
            inserted++;
        }

        await audit.LogAsync(session.UserId, "IMPORT", "CUSTOMERS", recordLabel: $"{inserted} customers imported");
        return Ok(new ImportResult(inserted, errors));
    }

    [HttpPost("suppliers")]
    [RequirePermission("SUPPLIERS", "CREATE")]
    public async Task<IActionResult> ImportSuppliers([FromBody] ImportRequest? body)
    {
        var session = HttpContext.GetSession()!;
        var rows = body?.Rows ?? new List<Dictionary<string, JsonElement>>();
        var errors = new List<ImportRowError>();
        var inserted = 0;

        using var connection = connectionFactory.Create();
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNum = i + 2;
            var name = (GetString(row, "Name") ?? "").Trim();
            var mobile = (GetString(row, "Mobile") ?? "").Trim();
            if (name.Length == 0) { errors.Add(new(rowNum, "Name is required")); continue; }
            if (mobile.Length == 0) { errors.Add(new(rowNum, "Mobile is required")); continue; }

            await connection.ExecuteAsync("dbo.sp_Import_Supplier_Create", new
            {
                Name = name,
                Mobile = mobile,
                Email = GetString(row, "Email"),
                Address = GetString(row, "Address"),
                City = GetString(row, "City"),
                State = GetString(row, "State"),
                Pincode = GetString(row, "Pincode"),
                Gstin = GetString(row, "GSTIN"),
                OpeningBalance = GetDecimalOrZero(row, "OpeningBalance"),
            }, commandType: CommandType.StoredProcedure);
            inserted++;
        }

        await audit.LogAsync(session.UserId, "IMPORT", "SUPPLIERS", recordLabel: $"{inserted} suppliers imported");
        return Ok(new ImportResult(inserted, errors));
    }

    [HttpPost("products")]
    [RequirePermission("PRODUCTS", "CREATE")]
    public async Task<IActionResult> ImportProducts([FromBody] ImportRequest? body)
    {
        var session = HttpContext.GetSession()!;
        var rows = body?.Rows ?? new List<Dictionary<string, JsonElement>>();
        var errors = new List<ImportRowError>();
        var inserted = 0;

        using var connection = connectionFactory.Create();
        var unitCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        var categoryCache = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNum = i + 2;

            var name = (GetString(row, "ProductName") ?? "").Trim();
            var sku = (GetString(row, "SKU") ?? "").Trim();
            var unitName = (GetString(row, "Unit") ?? "").Trim();
            var sellingPriceStr = GetString(row, "SellingPrice");

            if (name.Length == 0) { errors.Add(new(rowNum, "Product name is required")); continue; }
            if (sku.Length == 0) { errors.Add(new(rowNum, "SKU is required")); continue; }
            if (unitName.Length == 0) { errors.Add(new(rowNum, "Unit is required")); continue; }
            if (string.IsNullOrEmpty(sellingPriceStr) || !decimal.TryParse(sellingPriceStr, out var sellingPrice))
            {
                errors.Add(new(rowNum, "Selling price is required and must be numeric"));
                continue;
            }

            var skuExists = await connection.ExecuteScalarAsync<bool>(
                "dbo.sp_Product_SkuExists", new { Sku = sku, ExcludeProductId = (int?)null }, commandType: CommandType.StoredProcedure);
            if (skuExists) { errors.Add(new(rowNum, $"Duplicate SKU: {sku}")); continue; }

            if (!unitCache.TryGetValue(unitName, out var unitId))
            {
                var unitParams = new DynamicParameters();
                unitParams.Add("Name", unitName);
                unitParams.Add("UnitId", dbType: DbType.Int32, direction: ParameterDirection.Output);
                await connection.ExecuteAsync("dbo.sp_Import_Unit_FindOrCreate", unitParams, commandType: CommandType.StoredProcedure);
                unitId = unitParams.Get<int>("UnitId");
                unitCache[unitName] = unitId;
            }

            int? categoryId = null;
            var categoryName = GetString(row, "Category")?.Trim();
            if (!string.IsNullOrEmpty(categoryName))
            {
                if (!categoryCache.TryGetValue(categoryName, out var catId))
                {
                    var catParams = new DynamicParameters();
                    catParams.Add("Name", categoryName);
                    catParams.Add("CategoryId", dbType: DbType.Int32, direction: ParameterDirection.Output);
                    await connection.ExecuteAsync("dbo.sp_Import_Category_FindOrCreate", catParams, commandType: CommandType.StoredProcedure);
                    catId = catParams.Get<int>("CategoryId");
                    categoryCache[categoryName] = catId;
                }
                categoryId = catId;
            }

            var openingStock = GetDecimalOrZero(row, "OpeningStock");

            var productParams = new DynamicParameters();
            productParams.Add("Name", name);
            productParams.Add("Sku", sku);
            productParams.Add("CategoryId", categoryId);
            productParams.Add("UnitId", unitId);
            productParams.Add("PurchasePrice", GetDecimalOrZero(row, "PurchasePrice"));
            productParams.Add("SellingPrice", sellingPrice);
            productParams.Add("GstRate", GetDecimalOrZero(row, "GST"));
            productParams.Add("OpeningStock", openingStock);
            productParams.Add("MinimumStock", GetDecimalOrZero(row, "MinimumStock"));
            productParams.Add("Status", true);
            productParams.Add("CreatedById", session.UserId);
            productParams.Add("ProductId", dbType: DbType.Int32, direction: ParameterDirection.Output);

            await connection.ExecuteAsync("dbo.sp_Product_Create", productParams, commandType: CommandType.StoredProcedure);
            inserted++;
        }

        await audit.LogAsync(session.UserId, "IMPORT", "PRODUCTS", recordLabel: $"{inserted} products imported");
        return Ok(new ImportResult(inserted, errors));
    }

    [HttpPost("opening-stock")]
    [RequirePermission("INVENTORY", "CREATE")]
    public async Task<IActionResult> ImportOpeningStock([FromBody] ImportRequest? body)
    {
        var session = HttpContext.GetSession()!;
        var rows = body?.Rows ?? new List<Dictionary<string, JsonElement>>();
        var errors = new List<ImportRowError>();
        var inserted = 0;

        using var connection = connectionFactory.Create();
        for (var i = 0; i < rows.Count; i++)
        {
            var row = rows[i];
            var rowNum = i + 2;

            var sku = (GetString(row, "SKU") ?? "").Trim();
            if (sku.Length == 0) { errors.Add(new(rowNum, "SKU is required")); continue; }

            var quantity = GetDecimalOrZero(row, "OpeningStock");
            if (quantity <= 0) { errors.Add(new(rowNum, "Opening stock must be greater than 0")); continue; }

            var productId = await connection.ExecuteScalarAsync<int?>(
                "dbo.sp_Import_Product_GetIdBySku", new { Sku = sku }, commandType: CommandType.StoredProcedure);
            if (productId is null) { errors.Add(new(rowNum, $"No product found with SKU: {sku}")); continue; }

            var stockParams = new DynamicParameters();
            stockParams.Add("ProductId", productId);
            stockParams.Add("Type", "OPENING");
            stockParams.Add("QuantityIn", quantity);
            stockParams.Add("QuantityOut", 0m);
            stockParams.Add("Note", "Opening stock (import)");
            stockParams.Add("CreatedById", session.UserId);
            stockParams.Add("NewBalance", dbType: DbType.Decimal, direction: ParameterDirection.Output, precision: 18, scale: 2);
            stockParams.Add("TransactionId", dbType: DbType.Int32, direction: ParameterDirection.Output);
            await connection.ExecuteAsync("dbo.sp_Stock_RecordTransaction", stockParams, commandType: CommandType.StoredProcedure);
            inserted++;
        }

        await audit.LogAsync(session.UserId, "IMPORT", "INVENTORY", recordLabel: $"{inserted} opening stock rows imported");
        return Ok(new ImportResult(inserted, errors));
    }
}
