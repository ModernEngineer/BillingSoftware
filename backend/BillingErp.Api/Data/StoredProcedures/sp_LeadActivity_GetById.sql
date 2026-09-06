CREATE OR ALTER PROCEDURE dbo.sp_LeadActivity_GetById
    @ActivityId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        la.Id, la.LeadId, la.Note, la.NextFollowUpDate, la.CreatedById, cu.Name AS CreatedByName, la.CreatedAt
    FROM dbo.LeadActivities la
    JOIN dbo.Users cu ON cu.Id = la.CreatedById
    WHERE la.Id = @ActivityId;
END
