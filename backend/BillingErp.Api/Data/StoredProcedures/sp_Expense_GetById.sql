CREATE OR ALTER PROCEDURE dbo.sp_Expense_GetById
    @ExpenseId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        e.Id, e.CategoryId, c.Name AS CategoryName, c.Description AS CategoryDescription, c.Status AS CategoryStatus,
        e.Amount, e.Date, e.PaymentMethod, e.Description, e.Attachment,
        e.CreatedById, u.Name AS CreatedByName, e.CreatedAt
    FROM dbo.Expenses e
    JOIN dbo.ExpenseCategories c ON c.Id = e.CategoryId
    JOIN dbo.Users u ON u.Id = e.CreatedById
    WHERE e.Id = @ExpenseId;
END
