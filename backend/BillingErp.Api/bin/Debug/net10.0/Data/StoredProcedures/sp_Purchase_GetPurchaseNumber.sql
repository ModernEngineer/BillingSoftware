-- Lightweight existence check used by sp_PurchaseReturn_Create's caller.
CREATE OR ALTER PROCEDURE dbo.sp_Purchase_GetPurchaseNumber
    @PurchaseId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id FROM dbo.Purchases WHERE Id = @PurchaseId;
END
