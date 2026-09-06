CREATE OR ALTER PROCEDURE dbo.sp_Category_Create
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX) = NULL,
    @Status BIT = 1,
    @CategoryId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Categories (Name, Description, Status, CreatedAt)
    VALUES (@Name, @Description, @Status, SYSUTCDATETIME());

    SET @CategoryId = SCOPE_IDENTITY();
END
