namespace BillingErp.Api.Data.Entities;

public class BOMItem
{
    public int Id { get; set; }
    public int FinishedProductId { get; set; }
    public Product FinishedProduct { get; set; } = null!;
    public int ComponentProductId { get; set; }
    public Product ComponentProduct { get; set; } = null!;
    public decimal Quantity { get; set; }
}

// PLANNED | IN_PROGRESS | COMPLETED | CANCELLED
public class ProductionOrder
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public Product Product { get; set; } = null!;
    public decimal Quantity { get; set; }
    public string Status { get; set; } = "PLANNED";
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Notes { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public List<ProductionConsumption> Consumptions { get; set; } = new();
}

public class ProductionConsumption
{
    public int Id { get; set; }
    public int ProductionOrderId { get; set; }
    public ProductionOrder ProductionOrder { get; set; } = null!;
    public int ComponentProductId { get; set; }
    public Product ComponentProduct { get; set; } = null!;
    public decimal QuantityConsumed { get; set; }
}
