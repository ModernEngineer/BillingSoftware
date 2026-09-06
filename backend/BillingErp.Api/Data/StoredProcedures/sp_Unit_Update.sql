CREATE OR ALTER PROCEDURE dbo.sp_Unit_Update
    @UnitId INT,
    @Name NVARCHAR(200) = NULL,
    @ShortName NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Units
    SET Name = COALESCE(@Name, Name),
        ShortName = COALESCE(@ShortName, ShortName)
    WHERE Id = @UnitId;
END
