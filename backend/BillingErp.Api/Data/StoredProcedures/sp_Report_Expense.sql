-- 3 result sets: 1) totalExpenses, 2) byCategory (category,amount), 3) full expense rows.
CREATE OR ALTER PROCEDURE dbo.sp_Report_Expense
    @From DATETIME2,
    @To DATETIME2
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COALESCE(SUM(Amount), 0) AS TotalExpenses
    FROM dbo.Expenses
    WHERE Date >= @From AND Date <= @To;

    SELECT c.Name AS Category, SUM(e.Amount) AS Amount
    FROM dbo.Expenses e
    JOIN dbo.ExpenseCategories c ON c.Id = e.CategoryId
    WHERE e.Date >= @From AND e.Date <= @To
    GROUP BY c.Name;

    SELECT
        e.Id, e.CategoryId, c.Name AS CategoryName, e.Amount, e.Date, e.PaymentMethod,
        e.Description, e.Attachment, e.CreatedById, e.CreatedAt
    FROM dbo.Expenses e
    JOIN dbo.ExpenseCategories c ON c.Id = e.CategoryId
    WHERE e.Date >= @From AND e.Date <= @To
    ORDER BY e.Date ASC;
END
