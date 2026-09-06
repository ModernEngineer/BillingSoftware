CREATE OR ALTER PROCEDURE dbo.sp_Import_Unit_FindOrCreate
    @Name NVARCHAR(100),
    @UnitId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT @UnitId = Id FROM dbo.Units WHERE Name = @Name;
    IF @UnitId IS NULL
    BEGIN
        INSERT INTO dbo.Units (Name) VALUES (@Name);
        SET @UnitId = SCOPE_IDENTITY();
    END
END
