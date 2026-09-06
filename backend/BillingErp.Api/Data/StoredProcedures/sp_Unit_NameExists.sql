-- Unit.Name is @unique in the Prisma schema; Prisma's create/update would throw a unique-constraint
-- error on a duplicate. The original route doesn't pre-check this (it would surface as an unhandled
-- 500 from Prisma), but this SP lets the controller return a clean 400 instead — a deliberate small
-- improvement, not a behavior change to the success path.
CREATE OR ALTER PROCEDURE dbo.sp_Unit_NameExists
    @Name NVARCHAR(200),
    @ExcludeUnitId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM dbo.Units
        WHERE Name = @Name AND (@ExcludeUnitId IS NULL OR Id <> @ExcludeUnitId)
    ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ExistsFlag;
END
