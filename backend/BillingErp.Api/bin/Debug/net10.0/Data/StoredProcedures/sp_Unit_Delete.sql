-- Matches the original route (src/app/api/units/[id]/route.ts): blocks the delete with a 400
-- (not a deactivate — Unit has no Status column) when any product references it.
CREATE OR ALTER PROCEDURE dbo.sp_Unit_Delete
    @UnitId INT,
    @UnitName NVARCHAR(200) OUTPUT,
    @ProductCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT @UnitName = Name FROM dbo.Units WHERE Id = @UnitId;
    SELECT @ProductCount = COUNT(*) FROM dbo.Products WHERE UnitId = @UnitId;

    IF @UnitName IS NOT NULL AND @ProductCount = 0
    BEGIN
        DELETE FROM dbo.Units WHERE Id = @UnitId;
    END
END
