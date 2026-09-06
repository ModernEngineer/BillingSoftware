-- Hard delete, matching the original's prisma.lead.delete (no soft-delete convention for Lead).
-- LeadActivities cascade-delete via the FK (ON DELETE CASCADE) configured in AppDbContext.
CREATE OR ALTER PROCEDURE dbo.sp_Lead_Delete
    @LeadId INT,
    @LeadName NVARCHAR(200) OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT @LeadName = Name FROM dbo.Leads WHERE Id = @LeadId;
    DELETE FROM dbo.Leads WHERE Id = @LeadId;
END
