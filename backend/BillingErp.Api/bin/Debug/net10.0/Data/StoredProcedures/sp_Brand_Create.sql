CREATE OR ALTER PROCEDURE dbo.sp_Brand_Create
    @Name NVARCHAR(200),
    @BrandId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Brands (Name, Status)
    VALUES (@Name, 1);

    SET @BrandId = SCOPE_IDENTITY();
END
