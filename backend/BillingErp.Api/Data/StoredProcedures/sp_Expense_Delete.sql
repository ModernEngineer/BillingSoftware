CREATE OR ALTER PROCEDURE dbo.sp_Expense_Delete
    @ExpenseId INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.Expenses WHERE Id = @ExpenseId;
    SELECT @@ROWCOUNT AS RowsDeleted;
END
