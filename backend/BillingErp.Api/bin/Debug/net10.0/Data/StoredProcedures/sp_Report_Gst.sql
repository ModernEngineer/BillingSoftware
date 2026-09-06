-- Both result sets filtered to CONFIRMED sales only (unlike sp_Report_Sales, which returns
-- unfiltered rows) — matches the original gst report route exactly.
CREATE OR ALTER PROCEDURE dbo.sp_Report_Gst
    @From DATETIME2,
    @To DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        COALESCE(SUM(TaxableAmount), 0) AS TaxableValue,
        COALESCE(SUM(Cgst), 0) AS Cgst,
        COALESCE(SUM(Sgst), 0) AS Sgst,
        COALESCE(SUM(Igst), 0) AS Igst,
        COALESCE(SUM(Cgst + Sgst + Igst), 0) AS TotalGst
    FROM dbo.Sales
    WHERE Status = 'CONFIRMED' AND InvoiceDate >= @From AND InvoiceDate <= @To;

    SELECT
        s.Id, s.InvoiceNumber, s.InvoiceDate, s.CustomerId, c.Name AS CustomerName, c.Gstin AS CustomerGstin,
        s.Subtotal, s.Discount, s.TaxableAmount, s.Cgst, s.Sgst, s.Igst, s.GrandTotal,
        s.PaidAmount, s.DueAmount, s.PaymentStatus, s.PaymentMethod, s.Status, s.CreatedById, s.CreatedAt
    FROM dbo.Sales s
    LEFT JOIN dbo.Customers c ON c.Id = s.CustomerId
    WHERE s.Status = 'CONFIRMED' AND s.InvoiceDate >= @From AND s.InvoiceDate <= @To
    ORDER BY s.InvoiceDate ASC;
END
