CREATE OR ALTER PROCEDURE dbo.sp_User_Create
    @Name NVARCHAR(200),
    @Email NVARCHAR(200),
    @Mobile NVARCHAR(50) = NULL,
    @PasswordHash NVARCHAR(200),
    @RoleId INT,
    @Status BIT = 1,
    @UserId INT OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.Users (Name, Email, Password, Mobile, RoleId, Status, CreatedAt, UpdatedAt)
    VALUES (@Name, @Email, @PasswordHash, @Mobile, @RoleId, @Status, SYSUTCDATETIME(), SYSUTCDATETIME());
    SET @UserId = SCOPE_IDENTITY();
END
