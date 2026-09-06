CREATE OR ALTER PROCEDURE dbo.sp_Expense_Create
    @CategoryId INT,
    @Amount DECIMAL(18,2),
    @Date DATETIME2,
    @PaymentMethod NVARCHAR(20),
    @Description NVARCHAR(MAX) = NULL,
    @Attachment NVARCHAR(500) = NULL,
    @CreatedById INT,
    @ExpenseId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Expenses (CategoryId, Amount, Date, PaymentMethod, Description, Attachment, CreatedById, CreatedAt)
    VALUES (@CategoryId, @Amount, @Date, @PaymentMethod, @Description, @Attachment, @CreatedById, SYSUTCDATETIME());
    SET @ExpenseId = SCOPE_IDENTITY();
END
