namespace BillingErp.Api.Dtos;

public record UserCreateRequest(string Name, string Email, string? Mobile, string Password, int RoleId, bool? Status);

public record UserUpdateRequest(string? Name, string? Email, string? Mobile, string? Password, int? RoleId, bool? Status);
