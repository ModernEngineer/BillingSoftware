namespace BillingErp.Api.Dtos;

public record LeadCreateRequest(
    string Name,
    string? Mobile,
    string? Email,
    string? Source,
    string? Status,
    int? AssignedToId,
    string? Notes);

public record LeadUpdateRequest(
    string? Name,
    string? Mobile,
    string? Email,
    string? Source,
    string? Status,
    int? AssignedToId,
    string? Notes);

public record LeadActivityCreateRequest(string Note, string? NextFollowUpDate);
