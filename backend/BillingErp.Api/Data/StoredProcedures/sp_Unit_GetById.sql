CREATE OR ALTER PROCEDURE dbo.sp_Unit_GetById
    @UnitId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        u.Id, u.Name, u.ShortName,
        COALESCE(pc.ProductCount, 0) AS ProductCount
    FROM dbo.Units u
    OUTER APPLY (
        SELECT COUNT(*) AS ProductCount FROM dbo.Products p WHERE p.UnitId = u.Id
    ) pc
    WHERE u.Id = @UnitId;
END
