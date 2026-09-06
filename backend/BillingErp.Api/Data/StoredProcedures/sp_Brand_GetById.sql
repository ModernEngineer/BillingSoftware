-- Not called by any original route directly (Brand has no [id]/route.ts), but included for
-- symmetry with the rest of the pattern and to re-fetch the row right after Create for the
-- 201 response body, same as every other entity in this pattern.
CREATE OR ALTER PROCEDURE dbo.sp_Brand_GetById
    @BrandId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Status FROM dbo.Brands WHERE Id = @BrandId;
END
