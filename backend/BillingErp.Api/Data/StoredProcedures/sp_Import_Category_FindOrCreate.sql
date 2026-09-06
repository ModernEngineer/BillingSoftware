CREATE OR ALTER PROCEDURE dbo.sp_Import_Category_FindOrCreate
    @Name NVARCHAR(200),
    @CategoryId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 1 @CategoryId = Id FROM dbo.Categories WHERE Name = @Name;
    IF @CategoryId IS NULL
    BEGIN
        INSERT INTO dbo.Categories (Name, CreatedAt) VALUES (@Name, SYSUTCDATETIME());
        SET @CategoryId = SCOPE_IDENTITY();
    END
END
