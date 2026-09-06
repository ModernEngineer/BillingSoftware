namespace BillingErp.Api.Dtos;

public record EmployeeCreateRequest(
    string Name,
    string? Designation,
    string? Department,
    string? Mobile,
    string? Email,
    string JoiningDate,
    decimal Salary,
    bool? Status);

public record EmployeeUpdateRequest(
    string? Name,
    string? Designation,
    string? Department,
    string? Mobile,
    string? Email,
    string? JoiningDate,
    decimal? Salary,
    bool? Status);

public record AttendanceUpsertRequest(
    int EmployeeId,
    string Date,
    string Status,
    string? CheckIn,
    string? CheckOut,
    string? Note);

public record PayrollGenerateRequest(int Month, int Year);

public record PayrollUpdateRequest(decimal? Allowances, decimal? Deductions, string? Status);
