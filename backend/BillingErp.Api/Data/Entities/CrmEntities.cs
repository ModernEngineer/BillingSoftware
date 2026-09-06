namespace BillingErp.Api.Data.Entities;

// NEW | CONTACTED | QUALIFIED | PROPOSAL | WON | LOST
public class Lead
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Mobile { get; set; }
    public string? Email { get; set; }
    public string? Source { get; set; }
    public string Status { get; set; } = "NEW";
    public int? AssignedToId { get; set; }
    public User? AssignedTo { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public List<LeadActivity> Activities { get; set; } = new();
}

public class LeadActivity
{
    public int Id { get; set; }
    public int LeadId { get; set; }
    public Lead Lead { get; set; } = null!;
    public string Note { get; set; } = string.Empty;
    public DateTime? NextFollowUpDate { get; set; }
    public int CreatedById { get; set; }
    public User CreatedBy { get; set; } = null!;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
