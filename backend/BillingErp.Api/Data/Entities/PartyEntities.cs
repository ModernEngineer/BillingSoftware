namespace BillingErp.Api.Data.Entities;

public class Customer
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? PaymentTerms { get; set; }
    public string? Notes { get; set; }
    public bool Status { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Sale> Sales { get; set; } = new();
    public List<SaleReturn> SaleReturns { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}

public class Supplier
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Mobile { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Address { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Pincode { get; set; }
    public string? Gstin { get; set; }
    public string? Pan { get; set; }
    public decimal OpeningBalance { get; set; }
    public decimal? CreditLimit { get; set; }
    public string? Notes { get; set; }
    public bool Status { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<Purchase> Purchases { get; set; } = new();
    public List<PurchaseReturn> PurchaseReturns { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
}
