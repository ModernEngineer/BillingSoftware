CREATE OR ALTER PROCEDURE dbo.sp_Purchase_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500
        p.Id, p.PurchaseNumber, p.SupplierInvoiceNumber, p.PurchaseDate, p.SupplierId, s.Name AS SupplierName,
        p.Subtotal, p.Discount, p.TaxableAmount, p.Cgst, p.Sgst, p.Igst, p.GrandTotal,
        p.PaidAmount, p.DueAmount, p.PaymentStatus, p.PaymentMethod, p.Status,
        p.CreatedById, u.Name AS CreatedByName, p.CreatedAt
    FROM dbo.Purchases p
    JOIN dbo.Suppliers s ON s.Id = p.SupplierId
    JOIN dbo.Users u ON u.Id = p.CreatedById
    ORDER BY p.Id DESC;
END
