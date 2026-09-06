namespace BillingErp.Api.Dtos;

public record UnitCreateRequest(
    string Name,
    string? ShortName);

public record UnitUpdateRequest(
    string? Name,
    string? ShortName);
