CREATE OR ALTER PROCEDURE dbo.sp_LeadActivity_Create
    @LeadId INT,
    @Note NVARCHAR(MAX),
    @NextFollowUpDate DATETIME2 = NULL,
    @CreatedById INT,
    @ActivityId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.LeadActivities (LeadId, Note, NextFollowUpDate, CreatedById, CreatedAt)
    VALUES (@LeadId, @Note, @NextFollowUpDate, @CreatedById, SYSUTCDATETIME());

    SET @ActivityId = SCOPE_IDENTITY();
END
