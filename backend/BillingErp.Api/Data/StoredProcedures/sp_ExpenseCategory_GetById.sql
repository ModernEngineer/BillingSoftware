-- Not used by any original route (Create's response is the freshly-created row itself in the
-- Prisma version), but included for symmetry/re-fetch consistency with the rest of the pattern.
CREATE OR ALTER PROCEDURE dbo.sp_ExpenseCategory_GetById
    @ExpenseCategoryId INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT Id, Name, Description, Status
    FROM dbo.ExpenseCategories
    WHERE Id = @ExpenseCategoryId;
END
