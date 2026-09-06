-- Two result sets: 1) return headers, 2) all items for those returns (grouped in C# by SaleReturnId).
CREATE OR ALTER PROCEDURE dbo.sp_SaleReturn_List
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.Id, r.ReturnNumber, r.SaleId, s.InvoiceNumber AS SaleInvoiceNumber,
        r.CustomerId, c.Name AS CustomerName,
        r.ReturnDate, r.Reason, r.TotalAmount, r.RefundMethod, r.CreatedById, r.CreatedAt
    FROM dbo.SaleReturns r
    JOIN dbo.Sales s ON s.Id = r.SaleId
    LEFT JOIN dbo.Customers c ON c.Id = r.CustomerId
    ORDER BY r.Id DESC;

    SELECT Id, SaleReturnId, ProductId, ProductName, Quantity, Rate, Total
    FROM dbo.SaleReturnItems
    ORDER BY SaleReturnId, Id;
END
