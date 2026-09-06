export interface LineItemInput {
  quantity: number;
  rate: number;
  discount: number;
  gstRate: number;
}

export interface LineItemComputed extends LineItemInput {
  taxableAmount: number;
  gstAmount: number;
  total: number;
}

export function computeLineItem(item: LineItemInput): LineItemComputed {
  const gross = item.quantity * item.rate;
  const taxableAmount = Math.max(0, gross - item.discount);
  const gstAmount = (taxableAmount * item.gstRate) / 100;
  return { ...item, taxableAmount, gstAmount, total: taxableAmount + gstAmount };
}

export function splitGst(totalGst: number, isInterstate: boolean) {
  if (isInterstate) return { cgst: 0, sgst: 0, igst: totalGst };
  return { cgst: totalGst / 2, sgst: totalGst / 2, igst: 0 };
}

export function computeInvoiceTotals(items: LineItemInput[], isInterstate: boolean) {
  const computed = items.map(computeLineItem);
  const subtotal = computed.reduce((sum, i) => sum + i.quantity * i.rate, 0);
  const discount = computed.reduce((sum, i) => sum + i.discount, 0);
  const taxableAmount = computed.reduce((sum, i) => sum + i.taxableAmount, 0);
  const totalGst = computed.reduce((sum, i) => sum + i.gstAmount, 0);
  const { cgst, sgst, igst } = splitGst(totalGst, isInterstate);
  const grandTotal = taxableAmount + totalGst;

  return { items: computed, subtotal, discount, taxableAmount, cgst, sgst, igst, grandTotal };
}

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
  "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  if (n < 100) return twoDigits(n);
  return `${ONES[Math.floor(n / 100)]} Hundred${n % 100 ? " " + twoDigits(n % 100) : ""}`;
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);

  if (rupees === 0 && paise === 0) return "Zero Rupees Only";

  let remaining = rupees;
  const parts: string[] = [];
  const crore = Math.floor(remaining / 10000000);
  remaining %= 10000000;
  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;
  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;
  const hundred = remaining;

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred) parts.push(threeDigits(hundred));

  let words = parts.length ? `${parts.join(" ")} Rupees` : "Zero Rupees";
  if (paise > 0) words += ` and ${twoDigits(paise)} Paise`;
  return `${words} Only`;
}
