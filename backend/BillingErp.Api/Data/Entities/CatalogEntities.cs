namespace BillingErp.Api.Data.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool Status { get; set; } = true;
    public List<Product> Products { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Brand
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public bool Status { get; set; } = true;
    public List<Product> Products { get; set; } = new();
}

public class Unit
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? ShortName { get; set; }
    public List<Product> Products { get; set; } = new();
}

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public string? Barcode { get; set; }
    public int? CategoryId { get; set; }
    public Category? Category { get; set; }
    public int? BrandId { get; set; }
    public Brand? Brand { get; set; }
    public int UnitId { get; set; }
    public Unit Unit { get; set; } = null!;
    public string? HsnCode { get; set; }
    public decimal PurchasePrice { get; set; }
    public decimal SellingPrice { get; set; }
    public decimal? Mrp { get; set; }
    public decimal GstRate { get; set; }
    public decimal OpeningStock { get; set; }
    public decimal MinimumStock { get; set; }
    public decimal? MaximumStock { get; set; }
    public string? Description { get; set; }
    public string? Image { get; set; }
    public bool Status { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<SaleItem> SaleItems { get; set; } = new();
    public List<PurchaseItem> PurchaseItems { get; set; } = new();
    public List<SaleReturnItem> SaleReturnItems { get; set; } = new();
    public List<PurchaseReturnItem> PurchaseReturnItems { get; set; } = new();
    public List<StockTransaction> StockTransactions { get; set; } = new();
    public List<StockAdjustment> StockAdjustments { get; set; } = new();
    public List<BOMItem> AsFinishedInBom { get; set; } = new();
    public List<BOMItem> AsComponentInBom { get; set; } = new();
    public List<ProductionOrder> ProductionOrders { get; set; } = new();
    public List<ProductionConsumption> ProductionConsumed { get; set; } = new();
}
