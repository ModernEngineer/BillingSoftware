CREATE OR ALTER PROCEDURE dbo.sp_Lead_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        l.Id, l.Name, l.Mobile, l.Email, l.Source, l.Status, l.AssignedToId, u.Name AS AssignedToName,
        l.Notes, l.CreatedAt, l.UpdatedAt,
        COALESCE(ac.ActivityCount, 0) AS ActivityCount
    FROM dbo.Leads l
    LEFT JOIN dbo.Users u ON u.Id = l.AssignedToId
    OUTER APPLY (
        SELECT COUNT(*) AS ActivityCount FROM dbo.LeadActivities la WHERE la.LeadId = l.Id
    ) ac
    ORDER BY l.Id DESC;
END
