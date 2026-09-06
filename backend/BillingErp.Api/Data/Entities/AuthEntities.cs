namespace BillingErp.Api.Data.Entities;

public class User
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public bool Status { get; set; } = true;
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<Sale> Sales { get; set; } = new();
    public List<Purchase> Purchases { get; set; } = new();
    public List<Payment> Payments { get; set; } = new();
    public List<Expense> Expenses { get; set; } = new();
    public List<StockTransaction> StockTransactions { get; set; } = new();
    public List<StockAdjustment> StockAdjustments { get; set; } = new();
    public List<SaleReturn> SaleReturns { get; set; } = new();
    public List<PurchaseReturn> PurchaseReturns { get; set; } = new();
    public List<Lead> AssignedLeads { get; set; } = new();
    public List<LeadActivity> LeadActivities { get; set; } = new();
    public List<ProductionOrder> ProductionOrders { get; set; } = new();
    public List<AuditLog> AuditLogs { get; set; } = new();
    public List<Notification> Notifications { get; set; } = new();
}

public class Role
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public List<User> Users { get; set; } = new();
    public List<RolePermission> Permissions { get; set; } = new();
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Permission
{
    public int Id { get; set; }
    public string Module { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public List<RolePermission> Roles { get; set; } = new();
}

public class RolePermission
{
    public int Id { get; set; }
    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;
    public int PermissionId { get; set; }
    public Permission Permission { get; set; } = null!;
}
