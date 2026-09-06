CREATE OR ALTER PROCEDURE dbo.sp_SaleReturn_GetItems
    @SaleReturnId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, SaleReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM dbo.SaleReturnItems
    WHERE SaleReturnId = @SaleReturnId
    ORDER BY Id;
END
