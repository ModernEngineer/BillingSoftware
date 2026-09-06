CREATE OR ALTER PROCEDURE dbo.sp_Audit_Log
    @UserId INT = NULL,
    @Action NVARCHAR(50),
    @Module NVARCHAR(50),
    @RecordId INT = NULL,
    @RecordLabel NVARCHAR(300) = NULL,
    @IpAddress NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.AuditLogs (UserId, Action, Module, RecordId, RecordLabel, IpAddress, CreatedAt)
    VALUES (@UserId, @Action, @Module, @RecordId, @RecordLabel, @IpAddress, SYSUTCDATETIME());
END
