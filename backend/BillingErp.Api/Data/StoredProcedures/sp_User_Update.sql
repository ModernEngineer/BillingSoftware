CREATE OR ALTER PROCEDURE dbo.sp_User_Update
    @UserId INT,
    @Name NVARCHAR(200) = NULL,
    @Email NVARCHAR(200) = NULL,
    @MobileProvided BIT = 0,
    @Mobile NVARCHAR(50) = NULL,
    @PasswordHash NVARCHAR(200) = NULL,
    @RoleId INT = NULL,
    @StatusProvided BIT = 0,
    @Status BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users
    SET Name = COALESCE(@Name, Name),
        Email = COALESCE(@Email, Email),
        Mobile = CASE WHEN @MobileProvided = 1 THEN @Mobile ELSE Mobile END,
        Password = COALESCE(@PasswordHash, Password),
        RoleId = COALESCE(@RoleId, RoleId),
        Status = CASE WHEN @StatusProvided = 1 THEN @Status ELSE Status END,
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @UserId;
END
