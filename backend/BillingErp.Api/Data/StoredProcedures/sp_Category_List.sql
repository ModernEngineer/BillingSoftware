CREATE OR ALTER PROCEDURE dbo.sp_Category_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        c.Id, c.Name, c.Description, c.Status, c.CreatedAt,
        COALESCE(pc.ProductCount, 0) AS ProductCount
    FROM dbo.Categories c
    OUTER APPLY (
        SELECT COUNT(*) AS ProductCount FROM dbo.Products p WHERE p.CategoryId = c.Id
    ) pc
    ORDER BY c.Name ASC;
END
