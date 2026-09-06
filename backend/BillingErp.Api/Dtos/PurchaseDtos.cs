namespace BillingErp.Api.Dtos;

public record PurchaseItemInput(int ProductId, string ProductName, decimal Quantity, decimal Rate, decimal? Discount, decimal? GstRate);

public record PurchaseCreateRequest(DateTime PurchaseDate, int SupplierId, string? SupplierInvoiceNumber, List<PurchaseItemInput> Items, List<PaymentInput>? Payments);

public record ReturnItemInput(int ProductId, string ProductName, decimal Quantity, decimal Rate);

public record SaleReturnCreateRequest(int SaleId, string Reason, string RefundMethod, List<ReturnItemInput> Items);

public record PurchaseReturnCreateRequest(int PurchaseId, string Reason, List<ReturnItemInput> Items);
