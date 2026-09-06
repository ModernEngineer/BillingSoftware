namespace BillingErp.Api.Services;

public record LineItemInput(decimal Quantity, decimal Rate, decimal Discount, decimal GstRate);

public record LineItemComputed(
    decimal Quantity, decimal Rate, decimal Discount, decimal GstRate,
    decimal TaxableAmount, decimal GstAmount, decimal Total);

public record GstSplit(decimal Cgst, decimal Sgst, decimal Igst);

public record InvoiceTotals(
    List<LineItemComputed> Items, decimal Subtotal, decimal Discount, decimal TaxableAmount,
    decimal Cgst, decimal Sgst, decimal Igst, decimal GrandTotal);

// Pure port of src/lib/gst.ts — no logic changes.
public static class GstService
{
    public static LineItemComputed ComputeLineItem(LineItemInput item)
    {
        var gross = item.Quantity * item.Rate;
        var taxableAmount = Math.Max(0, gross - item.Discount);
        var gstAmount = taxableAmount * item.GstRate / 100m;
        return new LineItemComputed(item.Quantity, item.Rate, item.Discount, item.GstRate, taxableAmount, gstAmount, taxableAmount + gstAmount);
    }

    public static GstSplit SplitGst(decimal totalGst, bool isInterstate) =>
        isInterstate ? new GstSplit(0, 0, totalGst) : new GstSplit(totalGst / 2, totalGst / 2, 0);

    public static InvoiceTotals ComputeInvoiceTotals(IEnumerable<LineItemInput> items, bool isInterstate)
    {
        var computed = items.Select(ComputeLineItem).ToList();
        var subtotal = computed.Sum(i => i.Quantity * i.Rate);
        var discount = computed.Sum(i => i.Discount);
        var taxableAmount = computed.Sum(i => i.TaxableAmount);
        var totalGst = computed.Sum(i => i.GstAmount);
        var split = SplitGst(totalGst, isInterstate);
        var grandTotal = taxableAmount + totalGst;
        return new InvoiceTotals(computed, subtotal, discount, taxableAmount, split.Cgst, split.Sgst, split.Igst, grandTotal);
    }

    private static readonly string[] Ones =
    [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
        "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
    ];
    private static readonly string[] Tens =
        ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

    private static string TwoDigits(int n) => n < 20 ? Ones[n] : $"{Tens[n / 10]}{(n % 10 != 0 ? " " + Ones[n % 10] : "")}";

    private static string ThreeDigits(int n) => n < 100 ? TwoDigits(n) : $"{Ones[n / 100]} Hundred{(n % 100 != 0 ? " " + TwoDigits(n % 100) : "")}";

    public static string AmountInWords(decimal amount)
    {
        var rupees = (int)Math.Floor(amount);
        var paise = (int)Math.Round((amount - rupees) * 100);

        if (rupees == 0 && paise == 0) return "Zero Rupees Only";

        var remaining = rupees;
        var parts = new List<string>();
        var crore = remaining / 10000000; remaining %= 10000000;
        var lakh = remaining / 100000; remaining %= 100000;
        var thousand = remaining / 1000; remaining %= 1000;
        var hundred = remaining;

        if (crore > 0) parts.Add($"{ThreeDigits(crore)} Crore");
        if (lakh > 0) parts.Add($"{ThreeDigits(lakh)} Lakh");
        if (thousand > 0) parts.Add($"{ThreeDigits(thousand)} Thousand");
        if (hundred > 0) parts.Add(ThreeDigits(hundred));

        var words = parts.Count > 0 ? $"{string.Join(" ", parts)} Rupees" : "Zero Rupees";
        if (paise > 0) words += $" and {TwoDigits(paise)} Paise";
        return $"{words} Only";
    }
}
