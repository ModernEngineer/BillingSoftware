using System.Data;
using BillingErp.Api.Auth;
using BillingErp.Api.Data;
using BillingErp.Api.Services;
using Dapper;
using Microsoft.AspNetCore.Mvc;

namespace BillingErp.Api.Controllers;

// Ports src/app/api/reports/{sales,purchase,gst,profit,payment,expense}/route.ts.
[ApiController]
[Route("api/reports")]
[RequirePermission("REPORTS", "VIEW")]
public class ReportsController(SqlConnectionFactory connectionFactory) : ControllerBase
{
    private record SalesSummaryRow(int TotalInvoices, decimal TotalSales, decimal TotalDiscount, decimal TaxableAmount, decimal TotalGst, decimal TotalPaid, decimal TotalDue);
    private record SalesRowDto(int Id, string InvoiceNumber, DateTime InvoiceDate, int? CustomerId, string? CustomerName, decimal Subtotal, decimal Discount, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst, decimal GrandTotal, decimal PaidAmount, decimal DueAmount, string PaymentStatus, string PaymentMethod, string Status, string? CancelReason, int CreatedById, DateTime CreatedAt);

    [HttpGet("sales")]
    public async Task<IActionResult> Sales([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Report_Sales", new { From = f, To = t }, commandType: CommandType.StoredProcedure);
        var summary = await multi.ReadSingleAsync<SalesSummaryRow>();
        var rows = (await multi.ReadAsync<SalesRowDto>()).ToList();

        return Ok(new
        {
            summary = new
            {
                totalInvoices = summary.TotalInvoices, totalSales = summary.TotalSales, totalDiscount = summary.TotalDiscount,
                taxableAmount = summary.TaxableAmount, totalGst = summary.TotalGst, totalPaid = summary.TotalPaid, totalDue = summary.TotalDue,
            },
            rows = rows.Select(r => new
            {
                id = r.Id, invoiceNumber = r.InvoiceNumber, invoiceDate = r.InvoiceDate, customerId = r.CustomerId,
                customer = r.CustomerId is null ? null : new { name = r.CustomerName },
                subtotal = r.Subtotal, discount = r.Discount, taxableAmount = r.TaxableAmount, cgst = r.Cgst, sgst = r.Sgst, igst = r.Igst,
                grandTotal = r.GrandTotal, paidAmount = r.PaidAmount, dueAmount = r.DueAmount, paymentStatus = r.PaymentStatus,
                paymentMethod = r.PaymentMethod, status = r.Status, cancelReason = r.CancelReason, createdById = r.CreatedById, createdAt = r.CreatedAt,
            }),
        });
    }

    private record PurchaseSummaryRow(int TotalPurchases, decimal TotalAmount, decimal TaxableAmount, decimal TotalGst, decimal TotalDiscount, decimal TotalPaid, decimal TotalDue);
    private record PurchaseRowDto(int Id, string PurchaseNumber, string? SupplierInvoiceNumber, DateTime PurchaseDate, int SupplierId, string SupplierName, decimal Subtotal, decimal Discount, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst, decimal GrandTotal, decimal PaidAmount, decimal DueAmount, string PaymentStatus, string PaymentMethod, string Status, int CreatedById, DateTime CreatedAt);

    [HttpGet("purchase")]
    public async Task<IActionResult> Purchase([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Report_Purchase", new { From = f, To = t }, commandType: CommandType.StoredProcedure);
        var summary = await multi.ReadSingleAsync<PurchaseSummaryRow>();
        var rows = (await multi.ReadAsync<PurchaseRowDto>()).ToList();

        return Ok(new
        {
            summary = new
            {
                totalPurchases = summary.TotalPurchases, totalAmount = summary.TotalAmount, taxableAmount = summary.TaxableAmount,
                totalGst = summary.TotalGst, totalDiscount = summary.TotalDiscount, totalPaid = summary.TotalPaid, totalDue = summary.TotalDue,
            },
            rows = rows.Select(r => new
            {
                id = r.Id, purchaseNumber = r.PurchaseNumber, supplierInvoiceNumber = r.SupplierInvoiceNumber, purchaseDate = r.PurchaseDate,
                supplierId = r.SupplierId, supplier = new { name = r.SupplierName },
                subtotal = r.Subtotal, discount = r.Discount, taxableAmount = r.TaxableAmount, cgst = r.Cgst, sgst = r.Sgst, igst = r.Igst,
                grandTotal = r.GrandTotal, paidAmount = r.PaidAmount, dueAmount = r.DueAmount, paymentStatus = r.PaymentStatus,
                paymentMethod = r.PaymentMethod, status = r.Status, createdById = r.CreatedById, createdAt = r.CreatedAt,
            }),
        });
    }

    private record GstSummaryRow(decimal TaxableValue, decimal Cgst, decimal Sgst, decimal Igst, decimal TotalGst);
    private record GstRowDto(int Id, string InvoiceNumber, DateTime InvoiceDate, int? CustomerId, string? CustomerName, string? CustomerGstin, decimal Subtotal, decimal Discount, decimal TaxableAmount, decimal Cgst, decimal Sgst, decimal Igst, decimal GrandTotal, decimal PaidAmount, decimal DueAmount, string PaymentStatus, string PaymentMethod, string Status, int CreatedById, DateTime CreatedAt);

    [HttpGet("gst")]
    public async Task<IActionResult> Gst([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Report_Gst", new { From = f, To = t }, commandType: CommandType.StoredProcedure);
        var summary = await multi.ReadSingleAsync<GstSummaryRow>();
        var rows = (await multi.ReadAsync<GstRowDto>()).ToList();

        return Ok(new
        {
            summary = new { taxableValue = summary.TaxableValue, cgst = summary.Cgst, sgst = summary.Sgst, igst = summary.Igst, totalGst = summary.TotalGst },
            rows = rows.Select(r => new
            {
                id = r.Id, invoiceNumber = r.InvoiceNumber, invoiceDate = r.InvoiceDate, customerId = r.CustomerId,
                customer = r.CustomerId is null ? null : new { name = r.CustomerName, gstin = r.CustomerGstin },
                subtotal = r.Subtotal, discount = r.Discount, taxableAmount = r.TaxableAmount, cgst = r.Cgst, sgst = r.Sgst, igst = r.Igst,
                grandTotal = r.GrandTotal, paidAmount = r.PaidAmount, dueAmount = r.DueAmount, paymentStatus = r.PaymentStatus,
                paymentMethod = r.PaymentMethod, status = r.Status, createdById = r.CreatedById, createdAt = r.CreatedAt,
            }),
        });
    }

    private record ProfitSummaryRow(decimal GrossSales, decimal Cost, decimal GrossProfit, decimal Expenses, decimal NetProfit, decimal ProfitPercent);

    [HttpGet("profit")]
    public async Task<IActionResult> Profit([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        var summary = await connection.QuerySingleAsync<ProfitSummaryRow>(
            "dbo.sp_Report_Profit", new { From = f, To = t }, commandType: CommandType.StoredProcedure);

        return Ok(new
        {
            summary = new
            {
                grossSales = summary.GrossSales, cost = summary.Cost, grossProfit = summary.GrossProfit,
                expenses = summary.Expenses, netProfit = summary.NetProfit, profitPercent = summary.ProfitPercent,
            },
        });
    }

    private record PaymentTotalsRow(decimal TotalReceived, decimal TotalPaid);
    private record ByMethodRow(string Method, decimal Amount);
    private record PaymentRowDto(int Id, string PaymentNumber, string Direction, DateTime Date, decimal Amount, string Method, string? ReferenceNo, string? Notes, int? CustomerId, string? CustomerName, int? SupplierId, string? SupplierName, int? SaleId, string? SaleInvoiceNumber, int? PurchaseId, string? PurchaseNumber, int CreatedById, DateTime CreatedAt);

    [HttpGet("payment")]
    public async Task<IActionResult> Payment([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Report_Payment", new { From = f, To = t }, commandType: CommandType.StoredProcedure);
        var totals = await multi.ReadSingleAsync<PaymentTotalsRow>();
        var byMethod = (await multi.ReadAsync<ByMethodRow>()).ToList();
        var rows = (await multi.ReadAsync<PaymentRowDto>()).ToList();

        return Ok(new
        {
            summary = new
            {
                totalReceived = totals.TotalReceived, totalPaid = totals.TotalPaid,
                byMethod = byMethod.Select(m => new { method = m.Method, amount = m.Amount }),
            },
            rows = rows.Select(r => new
            {
                id = r.Id, paymentNumber = r.PaymentNumber, direction = r.Direction, date = r.Date, amount = r.Amount,
                method = r.Method, referenceNo = r.ReferenceNo, notes = r.Notes,
                customerId = r.CustomerId, customer = r.CustomerId is null ? null : new { name = r.CustomerName },
                supplierId = r.SupplierId, supplier = r.SupplierId is null ? null : new { name = r.SupplierName },
                saleId = r.SaleId, sale = r.SaleId is null ? null : new { invoiceNumber = r.SaleInvoiceNumber },
                purchaseId = r.PurchaseId, purchase = r.PurchaseId is null ? null : new { purchaseNumber = r.PurchaseNumber },
                createdById = r.CreatedById, createdAt = r.CreatedAt,
            }),
        });
    }

    private record ExpenseTotalRow(decimal TotalExpenses);
    private record ByCategoryRow(string Category, decimal Amount);
    private record ExpenseRowDto(int Id, int CategoryId, string CategoryName, decimal Amount, DateTime Date, string PaymentMethod, string? Description, string? Attachment, int CreatedById, DateTime CreatedAt);

    [HttpGet("expense")]
    public async Task<IActionResult> Expense([FromQuery] string? from, [FromQuery] string? to)
    {
        var (f, t) = ReportDateRange.Parse(from, to);
        using var connection = connectionFactory.Create();
        using var multi = await connection.QueryMultipleAsync("dbo.sp_Report_Expense", new { From = f, To = t }, commandType: CommandType.StoredProcedure);
        var total = await multi.ReadSingleAsync<ExpenseTotalRow>();
        var byCategory = (await multi.ReadAsync<ByCategoryRow>()).ToList();
        var rows = (await multi.ReadAsync<ExpenseRowDto>()).ToList();

        return Ok(new
        {
            summary = new
            {
                totalExpenses = total.TotalExpenses,
                byCategory = byCategory.Select(c => new { category = c.Category, amount = c.Amount }),
            },
            rows = rows.Select(r => new
            {
                id = r.Id, categoryId = r.CategoryId, category = new { name = r.CategoryName },
                amount = r.Amount, date = r.Date, paymentMethod = r.PaymentMethod, description = r.Description,
                attachment = r.Attachment, createdById = r.CreatedById, createdAt = r.CreatedAt,
            }),
        });
    }
}
