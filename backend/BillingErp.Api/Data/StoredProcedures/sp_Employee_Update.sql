-- Partial update via COALESCE (same known nullable-clearing limitation as sp_Product_Update);
-- @StatusProvided BIT trick for the boolean Status column, same as sp_Product_Update.
CREATE OR ALTER PROCEDURE dbo.sp_Employee_Update
    @EmployeeId INT,
    @Name NVARCHAR(200) = NULL,
    @Designation NVARCHAR(100) = NULL,
    @Department NVARCHAR(100) = NULL,
    @Mobile NVARCHAR(20) = NULL,
    @Email NVARCHAR(200) = NULL,
    @JoiningDate DATETIME2 = NULL,
    @Salary DECIMAL(18,2) = NULL,
    @StatusProvided BIT = 0,
    @Status BIT = 0
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Employees
    SET Name = COALESCE(@Name, Name),
        Designation = COALESCE(@Designation, Designation),
        Department = COALESCE(@Department, Department),
        Mobile = COALESCE(@Mobile, Mobile),
        Email = COALESCE(@Email, Email),
        JoiningDate = COALESCE(@JoiningDate, JoiningDate),
        Salary = COALESCE(@Salary, Salary),
        Status = CASE WHEN @StatusProvided = 1 THEN @Status ELSE Status END
    WHERE Id = @EmployeeId;
END
