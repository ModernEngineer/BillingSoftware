namespace BillingErp.Api.Dtos;

public record BomCreateRequest(int FinishedProductId, int ComponentProductId, decimal Quantity);

public record ProductionOrderCreateRequest(int ProductId, decimal Quantity, string? Notes);
