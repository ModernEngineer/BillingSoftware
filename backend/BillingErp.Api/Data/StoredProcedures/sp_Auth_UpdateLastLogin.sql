CREATE OR ALTER PROCEDURE dbo.sp_Auth_UpdateLastLogin
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET LastLogin = SYSUTCDATETIME() WHERE Id = @UserId;
END
