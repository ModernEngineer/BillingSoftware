namespace BillingErp.Api.Dtos;

public record ExpenseCategoryCreateRequest(
    string Name,
    string? Description);
