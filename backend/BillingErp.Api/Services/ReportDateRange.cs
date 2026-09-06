namespace BillingErp.Api.Services;

// Pure port of src/lib/report-range.ts's parseDateRange — no DB access.
public static class ReportDateRange
{
    public static (DateTime From, DateTime To) Parse(string? fromParam, string? toParam)
    {
        var from = fromParam is not null ? DateTime.Parse(fromParam) : new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
        var to = toParam is not null
            ? DateTime.Parse(toParam).Date.AddDays(1).AddMilliseconds(-1)
            : DateTime.Now;
        return (from, to);
    }
}
