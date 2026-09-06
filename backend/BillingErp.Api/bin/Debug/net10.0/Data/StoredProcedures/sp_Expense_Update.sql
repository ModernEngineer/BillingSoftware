CREATE OR ALTER PROCEDURE dbo.sp_Expense_Update
    @ExpenseId INT,
    @CategoryId INT = NULL,
    @Amount DECIMAL(18,2) = NULL,
    @Date DATETIME2 = NULL,
    @PaymentMethod NVARCHAR(20) = NULL,
    @DescriptionProvided BIT = 0,
    @Description NVARCHAR(MAX) = NULL,
    @AttachmentProvided BIT = 0,
    @Attachment NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Expenses
    SET CategoryId = COALESCE(@CategoryId, CategoryId),
        Amount = COALESCE(@Amount, Amount),
        Date = COALESCE(@Date, Date),
        PaymentMethod = COALESCE(@PaymentMethod, PaymentMethod),
        Description = CASE WHEN @DescriptionProvided = 1 THEN @Description ELSE Description END,
        Attachment = CASE WHEN @AttachmentProvided = 1 THEN @Attachment ELSE Attachment END
    WHERE Id = @ExpenseId;
END
