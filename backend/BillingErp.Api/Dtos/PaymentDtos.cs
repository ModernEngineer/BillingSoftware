namespace BillingErp.Api.Dtos;

public record ReceivePaymentRequest(int CustomerId, int SaleId, decimal Amount, string Method, DateTime Date, string? ReferenceNo, string? Notes);

public record PayPaymentRequest(int SupplierId, int PurchaseId, decimal Amount, string Method, DateTime Date, string? ReferenceNo, string? Notes);
