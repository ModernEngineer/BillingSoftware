CREATE OR ALTER PROCEDURE dbo.sp_ExpenseCategory_Create
    @Name NVARCHAR(200),
    @Description NVARCHAR(MAX) = NULL,
    @ExpenseCategoryId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;

    INSERT INTO dbo.ExpenseCategories (Name, Description, Status)
    VALUES (@Name, @Description, 1);

    SET @ExpenseCategoryId = SCOPE_IDENTITY();
END
