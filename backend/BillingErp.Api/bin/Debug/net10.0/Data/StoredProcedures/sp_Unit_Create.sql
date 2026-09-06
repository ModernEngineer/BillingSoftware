CREATE OR ALTER PROCEDURE dbo.sp_Unit_Create
    @Name NVARCHAR(200),
    @ShortName NVARCHAR(50) = NULL,
    @UnitId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.Units (Name, ShortName)
    VALUES (@Name, @ShortName);

    SET @UnitId = SCOPE_IDENTITY();
END
