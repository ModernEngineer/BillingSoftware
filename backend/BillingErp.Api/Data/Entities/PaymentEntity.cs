namespace BillingErp.Api.Data.Entities;

public class Payment
{
    public int Id { get; set; }
    public string PaymentNumber { get; set; } = string.Empty;
    public string Direction { get; set; } = string.Empty; // RECEIVE | PAY
    public DateTime Date { get; set; }
    public decimal Amount { get; set; }
    public string Method { get; set; } = string.Empty; // CASH | UPI | CARD | BANK | CREDIT
    public string? ReferenceNo { get; set; }
    public string? Notes { get; set; }

    public int? CustomerId { get; set; }
    public Customer? Customer { get; set; }
    public int? SupplierId { get; set; }
    public Supplier? Supplier { get; set; }
    public int? SaleId { get; set; }
    public Sale? Sale { get; set; }
    public int? PurchaseId { get; set; }
    public Purchase? Purchase { get; set; }

    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
