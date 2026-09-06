namespace BillingErp.Api.Dtos;

public record SupplierCreateRequest(
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
    string? Notes,
    bool? Status);

public record SupplierUpdateRequest(
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
    string? Notes,
    bool? Status);
