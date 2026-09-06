namespace BillingErp.Api.Dtos;

public record CategoryCreateRequest(
    string Name,
    string? Description,
    bool? Status);

public record CategoryUpdateRequest(
    string? Name,
    string? Description,
    bool? Status);
