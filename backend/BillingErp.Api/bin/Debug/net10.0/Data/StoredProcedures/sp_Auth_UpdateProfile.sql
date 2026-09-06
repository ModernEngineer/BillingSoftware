CREATE OR ALTER PROCEDURE dbo.sp_Auth_UpdateProfile
    @UserId INT,
    @Name NVARCHAR(200) = NULL,
    @Email NVARCHAR(200) = NULL,
    @MobileProvided BIT = 0,
    @Mobile NVARCHAR(50) = NULL,
    @PasswordHash NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.Users
    SET Name = COALESCE(@Name, Name),
        Email = COALESCE(@Email, Email),
        Mobile = CASE WHEN @MobileProvided = 1 THEN @Mobile ELSE Mobile END,
        Password = COALESCE(@PasswordHash, Password),
        UpdatedAt = SYSUTCDATETIME()
    WHERE Id = @UserId;

    SELECT u.Id, u.Name, u.Email, u.Mobile, u.RoleId, r.Name AS RoleName
    FROM dbo.Users u
    JOIN dbo.Roles r ON r.Id = u.RoleId
    WHERE u.Id = @UserId;
END
