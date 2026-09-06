CREATE OR ALTER PROCEDURE dbo.sp_PurchaseReturn_List
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.Id, r.ReturnNumber, r.PurchaseId, p.PurchaseNumber,
        r.SupplierId, s.Name AS SupplierName,
        r.ReturnDate, r.Reason, r.TotalAmount, r.CreatedById, r.CreatedAt
    FROM dbo.PurchaseReturns r
    JOIN dbo.Purchases p ON p.Id = r.PurchaseId
    LEFT JOIN dbo.Suppliers s ON s.Id = r.SupplierId
    ORDER BY r.Id DESC;

    SELECT Id, PurchaseReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM dbo.PurchaseReturnItems
    ORDER BY PurchaseReturnId, Id;
END
