-- Two result sets, matching the QueryMultipleAsync pattern (see SalesController):
-- 1) the lead header (+ AssignedToName)
-- 2) its activities, newest first, each with the creating user's name
CREATE OR ALTER PROCEDURE dbo.sp_Lead_GetById
    @LeadId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        l.Id, l.Name, l.Mobile, l.Email, l.Source, l.Status, l.AssignedToId, u.Name AS AssignedToName,
        l.Notes, l.CreatedAt, l.UpdatedAt
    FROM dbo.Leads l
    LEFT JOIN dbo.Users u ON u.Id = l.AssignedToId
    WHERE l.Id = @LeadId;

    SELECT
        la.Id, la.LeadId, la.Note, la.NextFollowUpDate, la.CreatedById, cu.Name AS CreatedByName, la.CreatedAt
    FROM dbo.LeadActivities la
    JOIN dbo.Users cu ON cu.Id = la.CreatedById
    WHERE la.LeadId = @LeadId
    ORDER BY la.Id DESC;
END
