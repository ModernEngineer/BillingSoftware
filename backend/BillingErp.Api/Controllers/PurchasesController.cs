using System.Data;
using System.Text.Json;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Dtos;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/purchases/route.ts and [id]/route.ts. No cancel endpoint exists in the
// original for purchases (only sales has one) — not invented here either.
[ApiController]
[Route("api/purchases")]
public class PurchasesController(SqlConnectionFactory connectionFactory, AuditService audit) : ControllerBase
{
    private record PurchaseRow(
        int Id, string PurchaseNumber, string? SupplierInvoiceNumber, DateTime PurchaseDate, int SupplierId,
        decimal Subtotal, decimal Discount, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst,
        decimal GrandTotal, decimal PaidAmount, decimal DueAmount, string PaymentStatus, string PaymentMethod,
        string Status, int CreatedById, DateTime CreatedAt);

    private record PurchaseListRow(
        int Id, string PurchaseNumber, string? SupplierInvoiceNumber, DateTime PurchaseDate, int SupplierId, string SupplierName,
        decimal Subtotal, decimal Discount, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst,
        decimal GrandTotal, decimal PaidAmount, decimal DueAmount, string PaymentStatus, string PaymentMethod,
        string Status, int CreatedById, string CreatedByName, DateTime CreatedAt);

    private record SupplierRow(
        int Id, string Name, string Mobile, string? Email, string? Address, string? City, string? State,
        string? Pincode, string? Gstin, string? Pan, decimal OpeningBalance, decimal? CreditLimit,
        string? Notes, bool Status, DateTime CreatedAt);

    private record PurchaseItemWithProductRow(
        int Id, int PurchaseId, int ProductId, string ProductName, decimal Quantity, decimal Rate, decimal Discount,
        decimal GstRate, decimal TaxableAmount, decimal GstAmount, decimal Total,
        int Product_Id, string Product_Name, string Product_Sku, string? Product_Barcode,
        int? Product_CategoryId, int? Product_BrandId, int Product_UnitId, string? Product_HsnCode,
        decimal Product_PurchasePrice, decimal Product_SellingPrice, decimal? Product_Mrp, decimal Product_GstRate,
        decimal Product_OpeningStock, decimal Product_MinimumStock, decimal? Product_MaximumStock,
        string? Product_Description, string? Product_Image, bool Product_Status,
        DateTime Product_CreatedAt, DateTime Product_UpdatedAt);

    private record PaymentRow(
        int Id, string PaymentNumber, string Direction, DateTime Date, decimal Amount, string Method,
        string? ReferenceNo, string? Notes, int? CustomerId, int? SupplierId, int? SaleId, int? PurchaseId,
        int CreatedById, DateTime CreatedAt);

    private static object ToSupplierJson(SupplierRow s) => new
    {
        id = s.Id, name = s.Name, mobile = s.Mobile, email = s.Email, address = s.Address, city = s.City,
        state = s.State, pincode = s.Pincode, gstin = s.Gstin, pan = s.Pan, openingBalance = s.OpeningBalance,
        creditLimit = s.CreditLimit, notes = s.Notes, status = s.Status, createdAt = s.CreatedAt,
    };

    private static object ToItemJson(PurchaseItemWithProductRow i) => new
    {
        id = i.Id, purchaseId = i.PurchaseId, productId = i.ProductId, productName = i.ProductName,
        quantity = i.Quantity, rate = i.Rate, discount = i.Discount, gstRate = i.GstRate,
        taxableAmount = i.TaxableAmount, gstAmount = i.GstAmount, total = i.Total,
        product = new
        {
            id = i.Product_Id, name = i.Product_Name, sku = i.Product_Sku, barcode = i.Product_Barcode,
            categoryId = i.Product_CategoryId, brandId = i.Product_BrandId, unitId = i.Product_UnitId,
            hsnCode = i.Product_HsnCode, purchasePrice = i.Product_PurchasePrice, sellingPrice = i.Product_SellingPrice,
            mrp = i.Product_Mrp, gstRate = i.Product_GstRate, openingStock = i.Product_OpeningStock,
            minimumStock = i.Product_MinimumStock, maximumStock = i.Product_MaximumStock,
            description = i.Product_Description, image = i.Product_Image, status = i.Product_Status,
            createdAt = i.Product_CreatedAt, updatedAt = i.Product_UpdatedAt,
        },
    };

    private static object ToPaymentJson(PaymentRow p) => new
    {
        id = p.Id, paymentNumber = p.PaymentNumber, direction = p.Direction, date = p.Date, amount = p.Amount,
        method = p.Method, referenceNo = p.ReferenceNo, notes = p.Notes, customerId = p.CustomerId,
        supplierId = p.SupplierId, saleId = p.SaleId, purchaseId = p.PurchaseId, createdById = p.CreatedById,
        createdAt = p.CreatedAt,
    };

    private static object ToDetailJson(PurchaseRow p, SupplierRow? supplier, string createdByName,
        List<PurchaseItemWithProductRow> items, List<PaymentRow> payments) => new
    {
        id = p.Id,
        purchaseNumber = p.PurchaseNumber,
        supplierInvoiceNumber = p.SupplierInvoiceNumber,
        purchaseDate = p.PurchaseDate,
        supplierId = p.SupplierId,
        supplier = supplier is null ? null : ToSupplierJson(supplier),
        subtotal = p.Subtotal,
        discount = p.Discount,
        taxableAmount = p.TaxableAmount,
        cgst = p.Cgst,
        sgst = p.Sgst,
        igst = p.Igst,
        grandTotal = p.GrandTotal,
        paidAmount = p.PaidAmount,
        dueAmount = p.DueAmount,
        paymentStatus = p.PaymentStatus,
        paymentMethod = p.PaymentMethod,
        status = p.Status,
        createdById = p.CreatedById,
        createdBy = new { name = createdByName },
        createdAt = p.CreatedAt,
        items = items.Select(ToItemJson),
        payments = payments.Select(ToPaymentJson),
    };

    [HttpGet]
    [RequirePermission("PURCHASE", "VIEW")]
    public async Task<IActionResult> List()
    {
        using var connection = connectionFactory.Create();
        var rows = await connection.QueryAsync<PurchaseListRow>("dbo.sp_Purchase_List", commandType: CommandType.StoredProcedure);
        return Ok(rows.Select(r => new
        {
            id = r.Id, purchaseNumber = r.PurchaseNumber, supplierInvoiceNumber = r.SupplierInvoiceNumber,
            purchaseDate = r.PurchaseDate, supplierId = r.SupplierId,
            supplier = new { id = r.SupplierId, name = r.SupplierName },
            subtotal = r.Subtotal, discount = r.Discount, taxableAmount = r.TaxableAmount, cgst = r.Cgst,
            sgst = r.Sgst, igst = r.Igst, grandTotal = r.GrandTotal, paidAmount = r.PaidAmount, dueAmount = r.DueAmount,
            paymentStatus = r.PaymentStatus, paymentMethod = r.PaymentMethod, status = r.Status,
            createdById = r.CreatedById, createdBy = new { name = r.CreatedByName }, createdAt = r.CreatedAt,
        }));
    }

    [HttpGet("{id:int}")]
    [RequirePermission("PURCHASE", "VIEW")]
    public async Task<IActionResult> GetById(int id)
    {
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Purchase_GetById", new { PurchaseId = id }, commandType: CommandType.StoredProcedure);
        var purchase = await multi.ReadSingleOrDefaultAsync<PurchaseRow>();
        if (purchase is null) return NotFound(new { error = "Purchase not found" });
        var supplier = await multi.ReadSingleOrDefaultAsync<SupplierRow>();
        var createdByName = await multi.ReadSingleOrDefaultAsync<string>();
        var items = (await multi.ReadAsync<PurchaseItemWithProductRow>()).ToList();
        var payments = (await multi.ReadAsync<PaymentRow>()).ToList();

        return Ok(ToDetailJson(purchase, supplier, createdByName ?? "", items, payments));
    }

    [HttpPost]
    [RequirePermission("PURCHASE", "CREATE")]
    public async Task<IActionResult> Create([FromBody] PurchaseCreateRequest? body)
    {
        if (body is null || body.Items is null || body.Items.Count == 0)
            return BadRequest(new { error = "Add at least one product" });
        foreach (var item in body.Items)
        {
            if (item.Quantity <= 0) return BadRequest(new { error = "Quantity must be greater than 0" });
            if (item.Rate < 0) return BadRequest(new { error = "Invalid input" });
        }

        var session = HttpContext.GetSession()!;
        using var connection = connectionFactory.Create();

        var ctxParams = new DynamicParameters();
        ctxParams.Add("SupplierId", body.SupplierId);
        ctxParams.Add("BusinessState", dbType: DbType.String, direction: ParameterDirection.Output, size: 100);
        ctxParams.Add("SupplierState", dbType: DbType.String, direction: ParameterDirection.Output, size: 100);
        ctxParams.Add("SupplierExists", dbType: DbType.Boolean, direction: ParameterDirection.Output);
        await connection.ExecuteAsync("dbo.sp_Purchase_PrepareContext", ctxParams, commandType: CommandType.StoredProcedure);

        if (!ctxParams.Get<bool>("SupplierExists")) return NotFound(new { error = "Supplier not found" });

        var businessState = ctxParams.Get<string?>("BusinessState");
        var supplierState = ctxParams.Get<string?>("SupplierState");
        var isInterstate = !string.IsNullOrEmpty(businessState) && !string.IsNullOrEmpty(supplierState)
            && !string.Equals(businessState, supplierState, StringComparison.OrdinalIgnoreCase);

        var lineItems = body.Items.Select(i => new LineItemInput(i.Quantity, i.Rate, i.Discount ?? 0, i.GstRate ?? 0)).ToList();
        var totals = GstService.ComputeInvoiceTotals(lineItems, isInterstate);

        var payments = body.Payments ?? new List<PaymentInput>();
        var paidAmount = payments.Sum(p => p.Amount);
        var dueAmount = Math.Max(0, totals.GrandTotal - paidAmount);
        var paymentStatus = paidAmount <= 0 ? "DUE" : dueAmount <= 0 ? "PAID" : "PARTIAL";
        var paymentMethod = payments.Count == 0 ? "CREDIT" : payments.Count == 1 ? payments[0].Method : "SPLIT";

        var itemsJson = JsonSerializer.Serialize(body.Items.Select((i, idx) => new
        {
            productId = i.ProductId, productName = i.ProductName,
            quantity = totals.Items[idx].Quantity, rate = totals.Items[idx].Rate, discount = totals.Items[idx].Discount,
            gstRate = totals.Items[idx].GstRate, taxableAmount = totals.Items[idx].TaxableAmount,
            gstAmount = totals.Items[idx].GstAmount, total = totals.Items[idx].Total,
        }));
        var paymentsJson = JsonSerializer.Serialize(payments.Select(p => new { method = p.Method, amount = p.Amount }));

        var parameters = new DynamicParameters();
        parameters.Add("PurchaseDate", body.PurchaseDate);
        parameters.Add("SupplierId", body.SupplierId);
        parameters.Add("SupplierInvoiceNumber", string.IsNullOrEmpty(body.SupplierInvoiceNumber) ? null : body.SupplierInvoiceNumber);
        parameters.Add("Subtotal", totals.Subtotal);
        parameters.Add("Discount", totals.Discount);
        parameters.Add("TaxableAmount", totals.TaxableAmount);
        parameters.Add("Cgst", totals.Cgst);
        parameters.Add("Sgst", totals.Sgst);
        parameters.Add("Igst", totals.Igst);
        parameters.Add("GrandTotal", totals.GrandTotal);
        parameters.Add("PaidAmount", paidAmount);
        parameters.Add("DueAmount", dueAmount);
        parameters.Add("PaymentStatus", paymentStatus);
        parameters.Add("PaymentMethod", paymentMethod);
        parameters.Add("ItemsJson", itemsJson);
        parameters.Add("PaymentsJson", paymentsJson);
        parameters.Add("CreatedById", session.UserId);
        parameters.Add("PurchaseId", dbType: DbType.Int32, direction: ParameterDirection.Output);
        parameters.Add("PurchaseNumber", dbType: DbType.String, direction: ParameterDirection.Output, size: 50);

        await connection.ExecuteAsync("dbo.sp_Purchase_Create", parameters, commandType: CommandType.StoredProcedure);
        var purchaseId = parameters.Get<int>("PurchaseId");
        var purchaseNumber = parameters.Get<string>("PurchaseNumber");

        await audit.LogAsync(session.UserId, "CREATE", "PURCHASE", purchaseId, purchaseNumber);

        using var multi = await connection.QueryMultipleAsync("dbo.sp_Purchase_GetById", new { PurchaseId = purchaseId }, commandType: CommandType.StoredProcedure);
        var purchaseRow = await multi.ReadSingleAsync<PurchaseRow>();
        var supplierRow = await multi.ReadSingleOrDefaultAsync<SupplierRow>();
        var createdByName = await multi.ReadSingleOrDefaultAsync<string>();
        var items = (await multi.ReadAsync<PurchaseItemWithProductRow>()).ToList();
        var createdPayments = (await multi.ReadAsync<PaymentRow>()).ToList();

        return StatusCode(201, ToDetailJson(purchaseRow, supplierRow, createdByName ?? "", items, createdPayments));
    }
}
