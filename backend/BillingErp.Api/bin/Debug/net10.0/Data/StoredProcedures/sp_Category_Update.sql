-- Partial update: any parameter left NULL keeps the column's existing value (COALESCE), matching
-- the original zod .optional() fields. Description can't be explicitly cleared back to NULL
-- through this procedure — same known simplification as sp_Product_Update.
CREATE OR ALTER PROCEDURE dbo.sp_Category_Update
    @CategoryId INT,
    @Name NVARCHAR(200) = NULL,
    @Description NVARCHAR(MAX) = NULL,
    @StatusProvided BIT = 0,
    @Status BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Categories
    SET Name = COALESCE(@Name, Name),
        Description = COALESCE(@Description, Description),
        Status = CASE WHEN @StatusProvided = 1 THEN @Status ELSE Status END
    WHERE Id = @CategoryId;
END
