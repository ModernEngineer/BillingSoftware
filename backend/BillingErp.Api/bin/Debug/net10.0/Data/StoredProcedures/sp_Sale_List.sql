CREATE OR ALTER PROCEDURE dbo.sp_Sale_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP 500
        s.Id, s.InvoiceNumber, s.InvoiceDate, s.CustomerId, c.Name AS CustomerName,
        s.Subtotal, s.Discount, s.TaxableAmount, s.Cgst, s.Sgst, s.Igst, s.GrandTotal,
        s.PaidAmount, s.DueAmount, s.PaymentStatus, s.PaymentMethod, s.Status, s.CancelReason,
        s.CreatedById, u.Name AS CreatedByName, s.CreatedAt
    FROM dbo.Sales s
    LEFT JOIN dbo.Customers c ON c.Id = s.CustomerId
    JOIN dbo.Users u ON u.Id = s.CreatedById
    ORDER BY s.Id DESC;
END
