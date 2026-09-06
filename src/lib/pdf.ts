import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportTableToPdf(
  filename: string,
  title: string,
  columns: string[],
  rows: (string | number)[][]
) {
  const doc = new jsPDF({ orientation: columns.length > 6 ? "landscape" : "portrait" });
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, {
    head: [columns],
    body: rows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 99, 235] },
  });
  doc.save(`${filename}.pdf`);
}
