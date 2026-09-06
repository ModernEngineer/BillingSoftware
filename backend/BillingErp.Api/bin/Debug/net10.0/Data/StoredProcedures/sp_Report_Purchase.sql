CREATE OR ALTER PROCEDURE dbo.sp_Report_Purchase
    @From DATETIME2,
    @To DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COUNT(*) AS TotalPurchases,
        COALESCE(SUM(GrandTotal), 0) AS TotalAmount,
        COALESCE(SUM(TaxableAmount), 0) AS TaxableAmount,
        COALESCE(SUM(Cgst + Sgst + Igst), 0) AS TotalGst,
        COALESCE(SUM(Discount), 0) AS TotalDiscount,
        COALESCE(SUM(PaidAmount), 0) AS TotalPaid,
        COALESCE(SUM(DueAmount), 0) AS TotalDue
    FROM dbo.Purchases
    WHERE PurchaseDate >= @From AND PurchaseDate <= @To AND Status = 'CONFIRMED';

    SELECT
        p.Id, p.PurchaseNumber, p.SupplierInvoiceNumber, p.PurchaseDate, p.SupplierId, s.Name AS SupplierName,
        p.Subtotal, p.Discount, p.TaxableAmount, p.Cgst, p.Sgst, p.Igst, p.GrandTotal,
        p.PaidAmount, p.DueAmount, p.PaymentStatus, p.PaymentMethod, p.Status, p.CreatedById, p.CreatedAt
    FROM dbo.Purchases p
    JOIN dbo.Suppliers s ON s.Id = p.SupplierId
    WHERE p.PurchaseDate >= @From AND p.PurchaseDate <= @To
    ORDER BY p.PurchaseDate ASC;
END
