-- Used by LeadsController when adding an activity to a lead, to return 404 instead of an FK
-- violation when the lead id doesn't exist (the original route had no such check and relied on
-- Prisma's FK error, which is a worse failure mode — see report for this judgment call).
CREATE OR ALTER PROCEDURE dbo.sp_Lead_Exists
    @LeadId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.Leads WHERE Id = @LeadId) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ExistsFlag;
END
