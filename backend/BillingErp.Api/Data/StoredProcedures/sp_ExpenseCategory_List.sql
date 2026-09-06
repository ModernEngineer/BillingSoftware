-- Matches src/app/api/expense-categories/route.ts's GET: only active (Status=1) categories.
CREATE OR ALTER PROCEDURE dbo.sp_ExpenseCategory_List
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Description, Status
    FROM dbo.ExpenseCategories
    WHERE Status = 1
    ORDER BY Name ASC;
END
