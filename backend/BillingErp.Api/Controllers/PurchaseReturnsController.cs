using System.Data;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/purchases/returns/route.ts.
[ApiController]
[Route("api/purchases/returns")]
public class PurchaseReturnsController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record ReturnHeaderRow(
        int Id, string ReturnNumber, int PurchaseId, string PurchaseNumber, int? SupplierId, string? SupplierName,
        DateTime ReturnDate, string Reason, decimal TotalAmount, int CreatedById, DateTime CreatedAt);

    private record ReturnItemRow(int Id, int PurchaseReturnId, int ProductId, string ProductName, decimal Quantity, decimal Rate, decimal Total);

    [HttpGet]
    [RequirePermission("PURCHASE", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_PurchaseReturn_List", commandType: CommandType.StoredProcedure);
        var headers = (await multi.ReadAsync<ReturnHeaderRow>()).ToList();
        var items = (await multi.ReadAsync<ReturnItemRow>()).ToList();
        var itemsByReturn = items.GroupBy(i => i.PurchaseReturnId).ToDictionary(g => g.Key, g => g.ToList());

        return Ok(headers.Select(h => new
        {
            id = h.Id,
            returnNumber = h.ReturnNumber,
            purchaseId = h.PurchaseId,
            purchase = new { purchaseNumber = h.PurchaseNumber },
            supplierId = h.SupplierId,
            supplier = h.SupplierId is null ? null : new { name = h.SupplierName },
            returnDate = h.ReturnDate,
            reason = h.Reason,
            totalAmount = h.TotalAmount,
            createdById = h.CreatedById,
            createdAt = h.CreatedAt,
            items = (itemsByReturn.TryGetValue(h.Id, out var its) ? its : new List<ReturnItemRow>())
                .Select(i => new { id = i.Id, purchaseReturnId = i.PurchaseReturnId, productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Total }),
        }));
    }

    [HttpPost]
    [RequirePermission("PURCHASE", "CREATE")]
    public async Task<IActionResult> Create([FromBody] PurchaseReturnCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Reason)) return BadRequest(new { error = "Return reason is required" });
        if (body.Items is null || body.Items.Count == 0) return BadRequest(new { error = "Select at least one product to return" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var purchaseExists = await connection.ExecuteScalarAsync<int?>(
            "dbo.sp_Purchase_GetPurchaseNumber", new { PurchaseId = body.PurchaseId }, commandType: CommandType.StoredProcedure);
        if (purchaseExists is null) return NotFound(new { error = "Purchase not found" });

        // Stock availability check — can't return more than currently in stock
        foreach (var item in body.Items)
        {
            var balance = await connection.ExecuteScalarAsync<decimal>(
                "dbo.sp_Stock_GetBalance", new { ProductId = item.ProductId }, commandType: CommandType.StoredProcedure);
            if (balance < item.Quantity)
            {
                return BadRequest(new { error = $"Cannot return {item.Quantity} of \"{item.ProductName}\" — only {balance} in stock." });
            }
        }

        var totalAmount = body.Items.Sum(i => i.Quantity * i.Rate);
        var itemsJson = JsonSerializer.Serialize(body.Items.Select(i => new
        {
            productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Quantity * i.Rate,
        }));

        var parameters = new DynamicParameters();
        parameters.Add("PurchaseId", body.PurchaseId);
        parameters.Add("Reason", body.Reason);
        parameters.Add("TotalAmount", totalAmount);
        parameters.Add("ItemsJson", itemsJson);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("PurchaseReturnId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("ReturnNumber", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);
        parameters.Add("NotFound", dbType: DbType.Boolean, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_PurchaseReturn_Create", parameters, commandType: CommandType.StoredProcedure);

        if (parameters.Get<bool>("NotFound")) return NotFound(new { error = "Purchase not found" });

        var returnId = parameters.Get<int>("PurchaseReturnId");
        var returnNumber = parameters.Get<string>("ReturnNumber");
        await audit.LogAsync(session.UserId, "CREATE", "PURCHASE", returnId, returnNumber);

        var itemRows = await connection.QueryAsync<ReturnItemRow>(
            "dbo.sp_PurchaseReturn_GetItems", new { PurchaseReturnId = returnId }, commandType: CommandType.StoredProcedure);

        return StatusCode(201, new
        {
            id = returnId,
            returnNumber,
            purchaseId = body.PurchaseId,
            reason = body.Reason,
            totalAmount,
            createdById = session.UserId,
            items = itemRows.Select(i => new { id = i.Id, purchaseReturnId = i.PurchaseReturnId, productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Total }),
        });
    }
}
