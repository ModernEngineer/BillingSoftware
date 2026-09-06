using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/payments/route.ts, receive/route.ts, pay/route.ts.
[ApiController]
[Route("api/payments")]
public class PaymentsController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record PaymentListRow(
        int Id, string PaymentNumber, string Direction, DateTime Date, decimal Amount, string Method,
        string? ReferenceNo, string? Notes, int? CustomerId, string? CustomerName, int? SupplierId, string? SupplierName,
        int? SaleId, string? SaleInvoiceNumber, int? PurchaseId, string? PurchaseNumber, int CreatedById, DateTime CreatedAt);

    [HttpGet]
    [RequirePermission("PAYMENTS", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<PaymentListRow>("dbo.sp_Payment_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(r => new
        {
            id = r.Id, paymentNumber = r.PaymentNumber, direction = r.Direction, date = r.Date, amount = r.Amount,
            method = r.Method, referenceNo = r.ReferenceNo, notes = r.Notes,
            customerId = r.CustomerId, customer = r.CustomerId is null ? null : new { name = r.CustomerName },
            supplierId = r.SupplierId, supplier = r.SupplierId is null ? null : new { name = r.SupplierName },
            saleId = r.SaleId, sale = r.SaleId is null ? null : new { invoiceNumber = r.SaleInvoiceNumber },
            purchaseId = r.PurchaseId, purchase = r.PurchaseId is null ? null : new { purchaseNumber = r.PurchaseNumber },
            createdById = r.CreatedById, createdAt = r.CreatedAt,
        }));
    }

    [HttpPost("receive")]
    [RequirePermission("PAYMENTS", "CREATE")]
    public async Task<IActionResult> Receive([FromBody] ReceivePaymentRequest? body)
    {
        if (body is null || body.Amount <= 0) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("CustomerId", body.CustomerId);
        parameters.Add("SaleId", body.SaleId);
        parameters.Add("Amount", body.Amount);
        parameters.Add("Method", body.Method);
        parameters.Add("Date", body.Date);
        parameters.Add("ReferenceNo", body.ReferenceNo);
        parameters.Add("Notes", body.Notes);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("PaymentId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("PaymentNumber", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);
        parameters.Add("NotFound", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("ExceedsDue", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("DueAmount", dbType: DbType.Decimal, direction: ParameterDirection.Output, precision: 18, scale: 2);
        parameters.Add("CreatedAt", dbType: DbType.DateTime2, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Payment_Receive", parameters, commandType: CommandType.StoredProcedure);

        if (parameters.Get<bool>("NotFound")) return NotFound(new { error = "Invoice not found for this customer." });
        if (parameters.Get<bool>("ExceedsDue"))
            return BadRequest(new { error = $"Amount exceeds due ({parameters.Get<decimal>("DueAmount")})." });

        var paymentId = parameters.Get<int>("PaymentId");
        var paymentNumber = parameters.Get<string>("PaymentNumber");
        await audit.LogAsync(session.UserId, "CREATE", "PAYMENTS", paymentId, paymentNumber);

        return StatusCode(201, new
        {
            id = paymentId, paymentNumber, direction = "RECEIVE", date = body.Date, amount = body.Amount,
            method = body.Method, referenceNo = body.ReferenceNo, notes = body.Notes,
            customerId = body.CustomerId, saleId = body.SaleId, createdById = session.UserId,
            createdAt = parameters.Get<DateTime>("CreatedAt"),
        });
    }

    [HttpPost("pay")]
    [RequirePermission("PAYMENTS", "CREATE")]
    public async Task<IActionResult> Pay([FromBody] PayPaymentRequest? body)
    {
        if (body is null || body.Amount <= 0) return BadRequest(new { error = "Invalid input" });

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var parameters = new DynamicParameters();
        parameters.Add("SupplierId", body.SupplierId);
        parameters.Add("PurchaseId", body.PurchaseId);
        parameters.Add("Amount", body.Amount);
        parameters.Add("Method", body.Method);
        parameters.Add("Date", body.Date);
        parameters.Add("ReferenceNo", body.ReferenceNo);
        parameters.Add("Notes", body.Notes);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("PaymentId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("PaymentNumber", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);
        parameters.Add("NotFound", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("ExceedsDue", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        parameters.Add("DueAmount", dbType: DbType.Decimal, direction: ParameterDirection.Output, precision: 18, scale: 2);
        parameters.Add("CreatedAt", dbType: DbType.DateTime2, direction: ParameterDirection.Output);

        await connection.ExecuteAsync("dbo.sp_Payment_Pay", parameters, commandType: CommandType.StoredProcedure);

        if (parameters.Get<bool>("NotFound")) return NotFound(new { error = "Purchase not found for this supplier." });
        if (parameters.Get<bool>("ExceedsDue"))
            return BadRequest(new { error = $"Amount exceeds due ({parameters.Get<decimal>("DueAmount")})." });

        var paymentId = parameters.Get<int>("PaymentId");
        var paymentNumber = parameters.Get<string>("PaymentNumber");
        await audit.LogAsync(session.UserId, "CREATE", "PAYMENTS", paymentId, paymentNumber);

        return StatusCode(201, new
        {
            id = paymentId, paymentNumber, direction = "PAY", date = body.Date, amount = body.Amount,
            method = body.Method, referenceNo = body.ReferenceNo, notes = body.Notes,
            supplierId = body.SupplierId, purchaseId = body.PurchaseId, createdById = session.UserId,
            createdAt = parameters.Get<DateTime>("CreatedAt"),
        });
    }
}
