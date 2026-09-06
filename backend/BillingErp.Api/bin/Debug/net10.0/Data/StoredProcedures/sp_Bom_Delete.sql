-- Hard delete, matching the original's prisma.bOMItem.delete (no soft-delete convention for BOM
-- rows, and no downstream FK references a BOMItem directly). Existence is checked here first so
-- a missing id returns a clean 404 from the controller instead of the original's unhandled-
-- exception-on-missing-row 500 -- a strictly safer behavior, not a change to the success path.
CREATE OR ALTER PROCEDURE dbo.sp_Bom_Delete
    @BOMItemId INT,
    @Found BIT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    SET @Found = CASE WHEN EXISTS (SELECT 1 FROM dbo.BOMItems WHERE Id = @BOMItemId) THEN 1 ELSE 0 END;
    IF @Found = 1
        DELETE FROM dbo.BOMItems WHERE Id = @BOMItemId;
END
