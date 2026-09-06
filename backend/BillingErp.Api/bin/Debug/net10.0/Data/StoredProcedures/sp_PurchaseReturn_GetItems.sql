CREATE OR ALTER PROCEDURE dbo.sp_PurchaseReturn_GetItems
    @PurchaseReturnId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, PurchaseReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM dbo.PurchaseReturnItems
    WHERE PurchaseReturnId = @PurchaseReturnId
    ORDER BY Id;
END
