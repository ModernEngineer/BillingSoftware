namespace BillingErp.Api.Dtos;

public record SaleItemInput(int ProductId, string ProductName, decimal Quantity, decimal Rate, decimal? Discount, decimal? GstRate);

public record PaymentInput(string Method, decimal Amount);

public record SaleCreateRequest(DateTime InvoiceDate, int? CustomerId, List<SaleItemInput> Items, List<PaymentInput>? Payments);

public record SaleCancelRequest(string Reason);
