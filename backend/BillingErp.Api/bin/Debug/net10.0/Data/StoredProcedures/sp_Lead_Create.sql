CREATE OR ALTER PROCEDURE dbo.sp_Lead_Create
    @Name NVARCHAR(200),
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Source NVARCHAR(100) = NULL,
    @Status NVARCHAR(20) = 'NEW',
    @AssignedToId INT = NULL,
    @Notes NVARCHAR(MAX) = NULL,
    @LeadId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Leads (Name, Mobile, Email, Source, Status, AssignedToId, Notes, CreatedAt, UpdatedAt)
    VALUES (@Name, @Mobile, @Email, @Source, @Status, @AssignedToId, @Notes, SYSUTCDATETIME(), SYSUTCDATETIME());

    SET @LeadId = SCOPE_IDENTITY();
END
