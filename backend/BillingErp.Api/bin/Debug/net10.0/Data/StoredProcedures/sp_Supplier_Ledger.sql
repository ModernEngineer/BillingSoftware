CREATE OR ALTER PROCEDURE dbo.sp_Supplier_Ledger
    @SupplierId INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT PurchaseDate AS Date, PurchaseNumber AS Reference, GrandTotal AS Amount
    FROM dbo.Purchases
    WHERE SupplierId = @SupplierId AND Status = 'CONFIRMED';

    SELECT Date, PaymentNumber AS Reference, Amount
    FROM dbo.Payments
    WHERE SupplierId = @SupplierId AND Direction = 'PAY';

    SELECT ReturnDate AS Date, ReturnNumber AS Reference, TotalAmount AS Amount
    FROM dbo.PurchaseReturns
    WHERE SupplierId = @SupplierId;
END
