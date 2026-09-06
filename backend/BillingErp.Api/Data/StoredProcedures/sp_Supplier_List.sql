CREATE OR ALTER PROCEDURE dbo.sp_Supplier_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        s.Id, s.Name, s.Mobile, s.Email, s.Address, s.City, s.State, s.Pincode, s.Gstin, s.Pan,
        s.OpeningBalance, s.CreditLimit, s.Notes, s.Status, s.CreatedAt,
        COALESCE(pa.TotalPurchase, 0) AS TotalPurchase,
        COALESCE(pa.Paid, 0) AS Paid,
        COALESCE(pa.Due, 0) + s.OpeningBalance AS Due
    FROM dbo.Suppliers s
    OUTER APPLY (
        SELECT SUM(p.GrandTotal) AS TotalPurchase, SUM(p.PaidAmount) AS Paid, SUM(p.DueAmount) AS Due
        FROM dbo.Purchases p
        WHERE p.SupplierId = s.Id AND p.Status = 'CONFIRMED'
    ) pa
    ORDER BY s.Name ASC;
END
