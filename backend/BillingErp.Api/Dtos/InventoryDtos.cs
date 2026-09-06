namespace BillingErp.Api.Dtos;

public record StockAdjustmentCreateRequest(int ProductId, string AdjustmentType, decimal Quantity, string Reason, string? Note);
