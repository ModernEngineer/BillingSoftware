namespace BillingErp.Api.Dtos;

public record LoginRequest(string Email, string Password);

public record ProfileUpdateRequest(string? Name, string? Email, string? Mobile, string CurrentPassword, string? NewPassword);
