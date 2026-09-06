using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/inventory/{adjustments,history,stock}/route.ts.
[ApiController]
[Route("api/inventory")]
public class InventoryController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record AdjustmentRow(
        int Id, int ProductId, string ProductName, string ProductSku, string AdjustmentType, decimal Quantity,
        string Reason, string? Note, int CreatedById, string CreatedByName, DateTime CreatedAt);

    private record HistoryRow(
        int Id, int ProductId, string ProductName, string ProductSku, string Type, decimal QuantityIn, decimal QuantityOut,
        decimal Balance, string? ReferenceType, int? ReferenceId, string? Note, int CreatedById, string CreatedByName, DateTime CreatedAt);

    private record StockProductRow(
        int Id, string Name, string Sku, decimal PurchasePrice, decimal MinimumStock,
        int? CategoryId, string? CategoryName, int UnitId, string UnitName, string? UnitShortName);

    private record StockTypeAggRow(int ProductId, string Type, decimal QuantityIn, decimal QuantityOut);

    [HttpGet("adjustments")]
    [RequirePermission("INVENTORY", "VIEW")]
    public async Task<IActionResult> ListAdjustments()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<AdjustmentRow>("dbo.sp_StockAdjustment_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(r => new
        {
            id = r.Id, productId = r.ProductId, product = new { name = r.ProductName, sku = r.ProductSku },
            adjustmentType = r.AdjustmentType, quantity = r.Quantity, reason = r.Reason, note = r.Note,
            createdById = r.CreatedById, createdBy = new { name = r.CreatedByName }, createdAt = r.CreatedAt,
        }));
    }

    [HttpPost("adjustments")]
    [RequirePermission("INVENTORY", "CREATE")]
    public async Task<IActionResult> CreateAdjustment([FromBody] StockAdjustmentCreateRequest? body)
    {
        if (body is null || body.Quantity <= 0) return BadRequest(new { error = "Quantity must be greater than 0" });
        if (string.IsNullOrWhiteSpace(body.Reason)) return BadRequest(new { error = "Reason is required" });
        if (body.AdjustmentType != "INCREASE" && body.AdjustmentType != "DECREASE")
            return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("ProductId", body.ProductId);
        parameters.Add("AdjustmentType", body.AdjustmentType);
        parameters.Add("Quantity", body.Quantity);
        parameters.Add("Reason", body.Reason);
        parameters.Add("Note", body.Note);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("AdjustmentId", dbType: DbType.Int32, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_StockAdjustment_Create", parameters, commandType: CommandType.StoredProcedure);
        var adjustmentId = parameters.Get<int>("AdjustmentId");

        await audit.LogAsync(session.UserId, "CREATE", "INVENTORY", adjustmentId);

        return StatusCode(201, new
        {
            id = adjustmentId, productId = body.ProductId, adjustmentType = body.AdjustmentType,
            quantity = body.Quantity, reason = body.Reason, note = body.Note, createdById = session.UserId,
        });
    }

    [HttpGet("history")]
    [RequirePermission("INVENTORY", "VIEW")]
    public async Task<IActionResult> History()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<HistoryRow>("dbo.sp_StockHistory_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(r => new
        {
            id = r.Id, productId = r.ProductId, product = new { name = r.ProductName, sku = r.ProductSku },
            type = r.Type, quantityIn = r.QuantityIn, quantityOut = r.QuantityOut, balance = r.Balance,
            referenceType = r.ReferenceType, referenceId = r.ReferenceId, note = r.Note,
            createdById = r.CreatedById, createdBy = new { name = r.CreatedByName }, createdAt = r.CreatedAt,
        }));
    }

    [HttpGet("stock")]
    [RequirePermission("INVENTORY", "VIEW")]
    public async Task<IActionResult> CurrentStock()
    {
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Stock_CurrentReport", commandType: CommandType.StoredProcedure);
        var products = (await multi.ReadAsync<StockProductRow>()).ToList();
        var aggRows = (await multi.ReadAsync<StockTypeAggRow>()).ToList();

        var byProduct = aggRows.GroupBy(a => a.ProductId).ToDictionary(g => g.Key, g => g.ToDictionary(a => a.Type, a => (In: a.QuantityIn, Out: a.QuantityOut)));

        var result = products.Select(p =>
        {
            var agg = byProduct.TryGetValue(p.Id, out var v) ? v : new Dictionary<string, (decimal In, decimal Out)>();
            decimal Get(string type, bool wantIn) => agg.TryGetValue(type, out var t) ? (wantIn ? t.In : t.Out) : 0;

            var opening = Get("OPENING", true) - Get("OPENING", false);
            var purchase = Get("PURCHASE", true) - Get("PURCHASE", false);
            var sales = Get("SALE", false) - Get("SALE", true);
            var saleReturn = Get("SALE_RETURN", true) - Get("SALE_RETURN", false);
            var purchaseReturn = Get("PURCHASE_RETURN", false) - Get("PURCHASE_RETURN", true);
            var adjustment = Get("ADJUSTMENT", true) - Get("ADJUSTMENT", false);
            var productionIn = Get("PRODUCTION_IN", true) - Get("PRODUCTION_IN", false);
            var productionOut = Get("PRODUCTION_OUT", false) - Get("PRODUCTION_OUT", true);

            var currentStock = opening + purchase - sales + saleReturn - purchaseReturn + adjustment + productionIn - productionOut;
            var status = currentStock <= 0 ? "OUT_OF_STOCK" : currentStock <= p.MinimumStock ? "LOW_STOCK" : "IN_STOCK";

            return new
            {
                id = p.Id,
                name = p.Name,
                sku = p.Sku,
                unit = new { id = p.UnitId, name = p.UnitName, shortName = p.UnitShortName },
                category = p.CategoryId is null ? null : new { id = p.CategoryId, name = p.CategoryName },
                stockValue = currentStock * p.PurchasePrice,
                openingStock = opening,
                purchase,
                sales,
                saleReturn,
                purchaseReturn,
                adjustment,
                currentStock,
                minimumStock = p.MinimumStock,
                status,
            };
        });

        return Ok(result);
    }
}
