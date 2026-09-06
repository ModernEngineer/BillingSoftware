-- Backs the original's unique-constraint pre-check (finishedProductId_componentProductId).
CREATE OR ALTER PROCEDURE dbo.sp_Bom_PairExists
    @FinishedProductId INT,
    @ComponentProductId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM dbo.BOMItems
        WHERE FinishedProductId = @FinishedProductId AND ComponentProductId = @ComponentProductId
    ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ExistsFlag;
END
