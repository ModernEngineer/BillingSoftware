using System.Data;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/sales/returns/route.ts.
[ApiController]
[Route("api/sales/returns")]
public class SaleReturnsController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record ReturnHeaderRow(
        int Id, string ReturnNumber, int SaleId, string SaleInvoiceNumber, int? CustomerId, string? CustomerName,
        DateTime ReturnDate, string Reason, decimal TotalAmount, string RefundMethod, int CreatedById, DateTime CreatedAt);

    private record ReturnItemRow(int Id, int SaleReturnId, int ProductId, string ProductName, decimal Quantity, decimal Rate, decimal Total);

    [HttpGet]
    [RequirePermission("SALES", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_SaleReturn_List", commandType: CommandType.StoredProcedure);
        var headers = (await multi.ReadAsync<ReturnHeaderRow>()).ToList();
        var items = (await multi.ReadAsync<ReturnItemRow>()).ToList();
        var itemsByReturn = items.GroupBy(i => i.SaleReturnId).ToDictionary(g => g.Key, g => g.ToList());

        return Ok(headers.Select(h => new
        {
            id = h.Id,
            returnNumber = h.ReturnNumber,
            saleId = h.SaleId,
            sale = new { invoiceNumber = h.SaleInvoiceNumber },
            customerId = h.CustomerId,
            customer = h.CustomerId is null ? null : new { name = h.CustomerName },
            returnDate = h.ReturnDate,
            reason = h.Reason,
            totalAmount = h.TotalAmount,
            refundMethod = h.RefundMethod,
            createdById = h.CreatedById,
            createdAt = h.CreatedAt,
            items = (itemsByReturn.TryGetValue(h.Id, out var its) ? its : new List<ReturnItemRow>())
                .Select(i => new { id = i.Id, saleReturnId = i.SaleReturnId, productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Total }),
        }));
    }

    [HttpPost]
    [RequirePermission("SALES", "CREATE")]
    public async Task<IActionResult> Create([FromBody] SaleReturnCreateRequest? body)
    {
        if (body is null || string.IsNullOrWhiteSpace(body.Reason)) return BadRequest(new { error = "Return reason is required" });
        if (body.Items is null || body.Items.Count == 0) return BadRequest(new { error = "Select at least one product to return" });
        foreach (var item in body.Items)
        {
            if (item.Quantity <= 0) return BadRequest(new { error = "Invalid input" });
        }

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var totalAmount = body.Items.Sum(i => i.Quantity * i.Rate);
        var itemsJson = JsonSerializer.Serialize(body.Items.Select(i => new
        {
            productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Quantity * i.Rate,
        }));

        var parameters = new DynamicParameters();
        parameters.Add("SaleId", body.SaleId);
        parameters.Add("Reason", body.Reason);
        parameters.Add("RefundMethod", body.RefundMethod);
        parameters.Add("TotalAmount", totalAmount);
        parameters.Add("ItemsJson", itemsJson);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("SaleReturnId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("ReturnNumber", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);
        parameters.Add("NotFound", dbType: DbType.Boolean, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_SaleReturn_Create", parameters, commandType: CommandType.StoredProcedure);

        if (parameters.Get<bool>("NotFound")) return NotFound(new { error = "Invoice not found" });

        var returnId = parameters.Get<int>("SaleReturnId");
        var returnNumber = parameters.Get<string>("ReturnNumber");
        await audit.LogAsync(session.UserId, "CREATE", "SALES", returnId, returnNumber);

        var itemRows = await connection.QueryAsync<ReturnItemRow>(
            "dbo.sp_SaleReturn_GetItems", new { SaleReturnId = returnId }, commandType: CommandType.StoredProcedure);

        return StatusCode(201, new
        {
            id = returnId,
            returnNumber,
            saleId = body.SaleId,
            reason = body.Reason,
            refundMethod = body.RefundMethod,
            totalAmount,
            createdById = session.UserId,
            items = itemRows.Select(i => new { id = i.Id, saleReturnId = i.SaleReturnId, productId = i.ProductId, productName = i.ProductName, quantity = i.Quantity, rate = i.Rate, total = i.Total }),
        });
    }
}
