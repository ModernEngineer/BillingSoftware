namespace BillingErp.Api.Dtos;

public record CustomerCreateRequest(
    string Name,
    string Mobile,
    string? Email,
    string? Address,
    string? City,
    string? State,
    string? Pincode,
    string? Gstin,
    string? Pan,
    decimal? OpeningBalance,
    decimal? CreditLimit,
    string? PaymentTerms,
    string? Notes,
    bool? Status);

public record CustomerUpdateRequest(
    string? Name,
    string? Mobile,
    string? Email,
    string? Address,
    string? City,
    string? State,
    string? Pincode,
    string? Gstin,
    string? Pan,
    decimal? OpeningBalance,
    decimal? CreditLimit,
    string? PaymentTerms,
    string? Notes,
    bool? Status);
