CREATE OR ALTER PROCEDURE dbo.sp_Auth_EmailExists
    @Email NVARCHAR(200),
    @ExcludeUserId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT CASE WHEN EXISTS (
        SELECT 1 FROM dbo.Users
        WHERE Email = @Email AND (@ExcludeUserId IS NULL OR Id <> @ExcludeUserId)
    ) THEN CAST(1 AS BIT) ELSE CAST(0 AS BIT) END AS ExistsFlag;
END
