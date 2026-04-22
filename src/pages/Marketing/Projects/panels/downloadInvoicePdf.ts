import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/**
 * Render a DOM node to an A4 PDF (portrait) and either trigger a download or
 * return the Blob. Uses an off-screen clone to dodge `overflow: hidden` clipping
 * (same technique as downloadSlipPdf).
 */
export async function renderInvoicePdf(
  source: HTMLElement,
  opts?: { filename?: string; asBlob?: boolean }
): Promise<Blob | void> {
  const clone = source.cloneNode(true) as HTMLElement;
  const wrap = document.createElement('div');
  wrap.style.position = 'fixed';
  wrap.style.left = '-10000px';
  wrap.style.top = '0';
  wrap.style.background = '#FFFFFF';
  wrap.style.width = `${source.scrollWidth}px`;
  wrap.appendChild(clone);
  document.body.appendChild(wrap);

  try {
    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#FFFFFF',
    });

    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Aspect-fit: widen to page width; scale height proportionally; top-align.
    const imgW = pageW;
    const imgH = (canvas.height * pageW) / canvas.width;
    const h = Math.min(imgH, pageH);

    pdf.addImage(
      canvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      imgW,
      h,
      undefined,
      'FAST'
    );

    if (opts?.asBlob) {
      return pdf.output('blob');
    }
    pdf.save(opts?.filename || 'invoice.pdf');
  } finally {
    document.body.removeChild(wrap);
  }
}
