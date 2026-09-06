namespace BillingErp.Api.Data.Entities;

// PURCHASE | SALE | SALE_RETURN | PURCHASE_RETURN | ADJUSTMENT | OPENING | PRODUCTION_IN | PRODUCTION_OUT
public class StockTransaction
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public decimal QuantityIn { get; set; }
    public decimal QuantityOut { get; set; }
    public decimal Balance { get; set; }
    public string? ReferenceType { get; set; }
    public int? ReferenceId { get; set; }
    public string? Note { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StockAdjustment
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public string AdjustmentType { get; set; } = string.Empty; // INCREASE | DECREASE
    public decimal Quantity { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string? Note { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
