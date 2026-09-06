-- Partial update via COALESCE, same known limitation as sp_Product_Update: a nullable column
-- (Mobile/Email/Source/AssignedToId/Notes) can't be explicitly cleared back to NULL through this
-- procedure, only set to a new non-null value or left untouched.
CREATE OR ALTER PROCEDURE dbo.sp_Lead_Update
    @LeadId INT,
    @Name NVARCHAR(200) = NULL,
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(200) = NULL,
    @Source NVARCHAR(100) = NULL,
    @Status NVARCHAR(20) = NULL,
    @AssignedToId INT = NULL,
    @Notes NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Leads
    SET Name = COALESCE(@Name, Name),
        Mobile = COALESCE(@Mobile, Mobile),
        Email = COALESCE(@Email, Email),
        Source = COALESCE(@Source, Source),
        Status = COALESCE(@Status, Status),
        AssignedToId = COALESCE(@AssignedToId, AssignedToId),
        Notes = COALESCE(@Notes, Notes),
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @LeadId;
END
