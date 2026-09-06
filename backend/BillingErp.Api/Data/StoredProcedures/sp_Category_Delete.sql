-- Unlike sp_Product_Delete, the original Next.js route (src/app/api/categories/[id]/route.ts)
-- does NOT deactivate a referenced category — it blocks the delete outright with a 400 error
-- ("Cannot delete: N product(s) use this category."). Preserved as-is: this SP only reports the
-- referencing product count; the controller decides whether to delete or return 400.
CREATE OR ALTER PROCEDURE dbo.sp_Category_Delete
    @CategoryId INT,
    @CategoryName NVARCHAR(200) OUTPUT,
    @ProductCount INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT @CategoryName = Name FROM dbo.Categories WHERE Id = @CategoryId;
    SELECT @ProductCount = COUNT(*) FROM dbo.Products WHERE CategoryId = @CategoryId;

    IF @CategoryName IS NOT NULL AND @ProductCount = 0
    BEGIN
        DELETE FROM dbo.Categories WHERE Id = @CategoryId;
    END
END
