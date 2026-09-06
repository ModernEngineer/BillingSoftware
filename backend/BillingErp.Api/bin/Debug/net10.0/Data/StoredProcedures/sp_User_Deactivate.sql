CREATE OR ALTER PROCEDURE dbo.sp_User_Deactivate
    @UserId INT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.Users SET Status = 0, UpdatedAt = SYSUTCDATETIME() WHERE Id = @UserId;
    SELECT Email FROM dbo.Users WHERE Id = @UserId;
END
