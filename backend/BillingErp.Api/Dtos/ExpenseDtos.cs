namespace BillingErp.Api.Dtos;

public record ExpenseCreateRequest(int CategoryId, decimal Amount, DateTime Date, string PaymentMethod, string? Description, string? Attachment);

public record ExpenseUpdateRequest(int? CategoryId, decimal? Amount, DateTime? Date, string? PaymentMethod, string? Description, string? Attachment);
