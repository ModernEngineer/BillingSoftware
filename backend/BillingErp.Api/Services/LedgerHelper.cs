namespace BillingErp.Api.Services;

public record LedgerEntry(DateTime Date, string Type, string Reference, decimal Debit, decimal Credit, decimal Balance);

// Pure port of src/lib/ledger.ts's withRunningBalance.
public static class LedgerHelper
{
    public static List<LedgerEntry> WithRunningBalance(
        IEnumerable<(DateTime Date, string Type, string Reference, decimal Debit, decimal Credit)> entries,
        decimal openingBalance,
        Func<decimal, decimal, decimal> delta)
    {
        var running = openingBalance;
        var result = new List<LedgerEntry>();
        foreach (var e in entries.OrderBy(e => e.Date))
        {
            running += delta(e.Debit, e.Credit);
            result.Add(new LedgerEntry(e.Date, e.Type, e.Reference, e.Debit, e.Credit, running));
        }
        return result;
    }
}
