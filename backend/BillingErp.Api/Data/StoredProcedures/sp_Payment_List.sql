CREATE OR ALTER PROCEDURE dbo.sp_Payment_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500
        p.Id, p.PaymentNumber, p.Direction, p.Date, p.Amount, p.Method, p.ReferenceNo, p.Notes,
        p.CustomerId, c.Name AS CustomerName,
        p.SupplierId, sup.Name AS SupplierName,
        p.SaleId, sa.InvoiceNumber AS SaleInvoiceNumber,
        p.PurchaseId, pu.PurchaseNumber AS PurchaseNumber,
        p.CreatedById, p.CreatedAt
    FROM dbo.Payments p
    LEFT JOIN dbo.Customers c ON c.Id = p.CustomerId
    LEFT JOIN dbo.Suppliers sup ON sup.Id = p.SupplierId
    LEFT JOIN dbo.Sales sa ON sa.Id = p.SaleId
    LEFT JOIN dbo.Purchases pu ON pu.Id = p.PurchaseId
    ORDER BY p.Id DESC;
END
