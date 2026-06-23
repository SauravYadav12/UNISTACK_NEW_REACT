import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// A4 dimensions in mm.
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

/**
 * Capture `element` as a canvas and drop it into an A4 PDF, scaling to fit so
 * the whole slip renders on one page regardless of its pixel height.
 *
 * Implementation notes:
 *  - We clone the element into a detached off-screen container before
 *    capture. This sidesteps two bugs we've hit:
 *      1. `overflow: hidden` on the slip (needed for the diagonal ribbon at
 *         render time) was truncating html2canvas's capture for some layouts.
 *      2. Ancestor scroll containers (MUI `DialogContent dividers`) were
 *         occasionally capping the captured height to the viewport.
 *    The clone gets `overflow: visible` and no height cap, so html2canvas
 *    always sees the element at its full natural height.
 *  - The captured image is center-fit into A4 — preserve aspect, never clip.
 */
export async function downloadSlipAsPdf(element: HTMLElement, filename: string) {
  // Build an off-screen host that's laid out but not visible to the user.
  const host = document.createElement('div');
  host.style.position = 'fixed';
  host.style.top = '0';
  host.style.left = '-10000px';
  host.style.background = '#ffffff';
  host.style.zIndex = '-1';
  host.style.pointerEvents = 'none';

  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.overflow = 'visible';
  clone.style.maxHeight = 'none';
  clone.style.boxShadow = 'none';
  host.appendChild(clone);
  document.body.appendChild(host);

  try {
    // One rAF + a short settle so fonts and any layout-affecting styles apply
    // on the clone before we rasterize.
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => setTimeout(resolve, 30));
    });

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // JPEG at 0.85 quality instead of PNG cuts file size by roughly
    // 5–10× for text-heavy documents (offer letters, policy docs,
    // salary slips) with no perceptible loss at typical zoom levels.
    // PNG is lossless but absurd for this content — a single offer
    // letter was hitting ~6 MB. Switching halves+ that to ~600 KB.
    const imgData = canvas.toDataURL('image/jpeg', 0.85);
    // `compress: true` runs FlateDecode over the PDF object streams.
    // The JPEG payload itself is already compressed, but headers,
    // metadata, and any non-image content still shrink.
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
      compress: true,
    });

    // Contain (preserve aspect, never clip).
    const canvasAspect = canvas.width / canvas.height;
    const pageAspect = A4_WIDTH_MM / A4_HEIGHT_MM;
    let renderWidth: number;
    let renderHeight: number;
    if (canvasAspect >= pageAspect) {
      // Shorter-than-A4 proportions → fit by width.
      renderWidth = A4_WIDTH_MM;
      renderHeight = A4_WIDTH_MM / canvasAspect;
    } else {
      // Taller-than-A4 proportions → fit by height.
      renderHeight = A4_HEIGHT_MM;
      renderWidth = A4_HEIGHT_MM * canvasAspect;
    }
    // Horizontally centered, top-aligned. Payslip convention — any leftover
    // page space falls at the bottom, not split above/below the content.
    const offsetX = (A4_WIDTH_MM - renderWidth) / 2;
    const offsetY = 0;

    // Use FAST compression for the image stream. jsPDF accepts a
    // compression flag per image; this matches the JPEG payload.
    pdf.addImage(imgData, 'JPEG', offsetX, offsetY, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(filename);
  } finally {
    host.remove();
  }
}
