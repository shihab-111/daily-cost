import { jsPDF } from 'jspdf';
import { CustomerReceiptFormValues } from './validators/schemas';
import { formatMoney } from './utils';

function loadLogoImage(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  if (!text) return [];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.52;
}

export async function renderReceiptToCanvas(
  receipt: CustomerReceiptFormValues
): Promise<HTMLCanvasElement> {
  const isThermal = receipt.paperStyle === 'pos_thermal';
  const isDark = receipt.paperStyle === 'dark_luxury';

  const scaleFactor =
    receipt.fontSizeScale === 'sm' ? 0.92 : receipt.fontSizeScale === 'lg' ? 1.12 : 1;
  const sz = (n: number) => Math.round(n * scaleFactor);

  const width = isThermal ? 720 : 1120;
  const pad = isThermal ? 44 : 68;
  const contentWidth = width - pad * 2;

  const fontStack =
    receipt.textStyle === 'classic_serif'
      ? 'Georgia, "Times New Roman", serif'
      : receipt.textStyle === 'mono_thermal'
      ? '"JetBrains Mono", "Courier New", monospace'
      : '"Plus Jakarta Sans", "DM Sans", system-ui, sans-serif';

  const monoStack = '"JetBrains Mono", ui-monospace, monospace';

  const bg = isDark ? '#09090b' : '#ffffff';
  const surface = isDark ? '#18181b' : '#f8fafc';
  const border = isDark ? '#27272a' : '#e2e8f0';
  const ink = isDark ? '#f4f4f5' : '#0f172a';
  const muted = isDark ? '#a1a1aa' : '#64748b';
  const accent = /^#[0-9a-fA-F]{6}$/.test(receipt.accentColor)
    ? receipt.accentColor
    : '#16a34a';
  const headerBg = /^#[0-9a-fA-F]{6}$/.test(receipt.headerBgColor)
    ? receipt.headerBgColor
    : isDark
    ? '#121214'
    : '#f8fafc';

  const headerIsDark = isDarkHex(headerBg);
  const headerInk = headerIsDark ? '#f4f4f5' : '#0f172a';
  const headerMuted = headerIsDark ? '#a1a1aa' : '#475569';

  const logoSizePx =
    receipt.logoSize === 'sm' ? 52 : receipt.logoSize === 'lg' ? 88 : 68;

  const logoImg =
    receipt.logoType === 'uploaded' ? await loadLogoImage(receipt.logoDataUrl) : null;

  const measureCanvas = document.createElement('canvas');
  const mCtx = measureCanvas.getContext('2d')!;
  mCtx.font = `${sz(15)}px ${fontStack}`;

  const footerLines = wrapText(mCtx, receipt.footerNote, contentWidth);
  const addressLines = wrapText(
    mCtx,
    [receipt.customerAddress, receipt.customerDistrict].filter(Boolean).join(', '),
    isThermal ? contentWidth - 40 : contentWidth * 0.46
  );

  const isCenteredHeader = receipt.logoPosition === 'center' || isThermal;
  const headerHeight = isCenteredHeader
    ? (receipt.logoType !== 'minimal_text' ? logoSizePx + 18 : 0) + 195
    : Math.max(185, logoSizePx + 110);
  const customerHeight = isThermal
    ? 175 + addressLines.length * 24
    : Math.max(155, 115 + addressLines.length * 24);
  const tableHeaderHeight = 46;
  const rowHeight = isThermal ? 58 : 54;
  const itemsHeight = receipt.items.length * rowHeight;
  const totalsHeight = 240;
  const footerHeight = 96 + footerLines.length * 24;

  const totalHeight =
    pad * 2 +
    headerHeight +
    customerHeight +
    tableHeaderHeight +
    itemsHeight +
    totalsHeight +
    footerHeight;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = totalHeight;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, totalHeight);

  // Header tint background
  ctx.fillStyle = headerBg;
  ctx.fillRect(0, 0, width, headerHeight + 18);

  // Top Accent Bar
  ctx.fillStyle = accent;
  ctx.fillRect(0, 0, width, 10);

  let y = 34;

  const drawLogoAt = (lx: number, ly: number) => {
    if (receipt.logoType === 'uploaded' && logoImg) {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(lx, ly, logoSizePx, logoSizePx, 12);
      ctx.clip();
      ctx.drawImage(logoImg, lx, ly, logoSizePx, logoSizePx);
      ctx.restore();
    } else if (receipt.logoType === 'monogram') {
      ctx.fillStyle = accent;
      ctx.beginPath();
      ctx.roundRect(lx, ly, logoSizePx, logoSizePx, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `700 ${Math.round(logoSizePx * 0.36)}px ${fontStack}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const mono = (receipt.logoText || receipt.businessName.slice(0, 2) || 'BD').toUpperCase();
      ctx.fillText(mono, lx + logoSizePx / 2, ly + logoSizePx / 2 + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    }
  };

  const memoTitle = (receipt.memoTitle || 'OFFICIAL RECEIPT').toUpperCase();
  const dateTimeStr = [receipt.issueDate, receipt.issueTime].filter(Boolean).join(' · ');

  if (receipt.logoPosition === 'center' && !isThermal) {
    let cy = y;
    if (receipt.logoType !== 'minimal_text') {
      drawLogoAt(width / 2 - logoSizePx / 2, cy);
      cy += logoSizePx + 18;
    }
    ctx.textAlign = 'center';
    ctx.fillStyle = headerInk;
    ctx.font = `700 ${sz(28)}px ${fontStack}`;
    ctx.fillText(receipt.businessName, width / 2, cy + 20);

    if (receipt.businessTagline) {
      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(15)}px ${fontStack}`;
      ctx.fillText(receipt.businessTagline, width / 2, cy + 44);
    }

    const bizContact = [receipt.businessPhone, receipt.businessAddress].filter(Boolean).join(' · ');
    if (bizContact) {
      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(13)}px ${fontStack}`;
      ctx.fillText(bizContact, width / 2, cy + 66);
    }

    ctx.fillStyle = accent;
    ctx.font = `700 ${sz(13)}px ${monoStack}`;
    ctx.fillText(
      `${memoTitle} · #${receipt.receiptNumber} · ${dateTimeStr}`,
      width / 2,
      cy + 94
    );
    ctx.textAlign = 'left';
  } else {
    let textStartX = pad;
    if (receipt.logoType !== 'minimal_text') {
      drawLogoAt(pad, y);
      if (!isThermal) {
        textStartX = pad + logoSizePx + 18;
      }
    }

    const textYOffset = isThermal && receipt.logoType !== 'minimal_text' ? logoSizePx + 16 : 0;

    ctx.fillStyle = headerInk;
    ctx.font = `700 ${sz(isThermal ? 25 : 29)}px ${fontStack}`;
    ctx.fillText(receipt.businessName, textStartX, y + textYOffset + 24);

    if (receipt.businessTagline) {
      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(14)}px ${fontStack}`;
      ctx.fillText(receipt.businessTagline, textStartX, y + textYOffset + 48);
    }

    const bizContact = [receipt.businessPhone, receipt.businessAddress].filter(Boolean).join(' · ');
    if (bizContact) {
      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(13)}px ${fontStack}`;
      ctx.fillText(bizContact, textStartX, y + textYOffset + 70);
    }

    if (!isThermal) {
      ctx.textAlign = 'right';
      ctx.fillStyle = accent;
      ctx.font = `700 ${sz(13)}px ${monoStack}`;
      ctx.fillText(memoTitle, width - pad, y + 18);

      ctx.fillStyle = headerInk;
      ctx.font = `600 ${sz(19)}px ${monoStack}`;
      ctx.fillText(receipt.receiptNumber, width - pad, y + 46);

      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(13)}px ${monoStack}`;
      ctx.fillText(`Issued: ${dateTimeStr}`, width - pad, y + 70);
      ctx.textAlign = 'left';
    } else {
      ctx.fillStyle = accent;
      ctx.font = `700 ${sz(13)}px ${monoStack}`;
      ctx.fillText(`${memoTitle} # ${receipt.receiptNumber}`, pad, y + textYOffset + 102);
      ctx.fillStyle = headerMuted;
      ctx.font = `400 ${sz(13)}px ${monoStack}`;
      ctx.fillText(`${dateTimeStr} · ${receipt.paymentMethod}`, pad, y + textYOffset + 124);
    }
  }

  y = headerHeight + 18;

  // Divider
  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(width, y);
  ctx.stroke();

  y += 28;

  // --- Customer & Delivery Block ---
  ctx.fillStyle = surface;
  ctx.beginPath();
  ctx.roundRect(pad, y, contentWidth, customerHeight - 28, 10);
  ctx.fill();
  ctx.strokeStyle = border;
  ctx.stroke();

  const innerY = y + 26;
  ctx.fillStyle = accent;
  ctx.font = `700 ${sz(12)}px ${monoStack}`;
  ctx.fillText('BILLED TO / CUSTOMER', pad + 20, innerY);

  ctx.fillStyle = ink;
  ctx.font = `600 ${sz(18)}px ${fontStack}`;
  ctx.fillText(receipt.customerName, pad + 20, innerY + 28);

  ctx.fillStyle = muted;
  ctx.font = `400 ${sz(14)}px ${fontStack}`;
  const custMeta = [receipt.customerPhone, receipt.customerEmail].filter(Boolean).join(' · ');
  if (custMeta) {
    ctx.fillText(custMeta, pad + 20, innerY + 52);
  }

  addressLines.forEach((line, idx) => {
    ctx.fillText(line, pad + 20, innerY + 76 + idx * 22);
  });

  if (!isThermal) {
    const rightX = width - pad - 20;
    ctx.textAlign = 'right';
    ctx.fillStyle = accent;
    ctx.font = `700 ${sz(12)}px ${monoStack}`;
    ctx.fillText('DELIVERY & PAYMENT', rightX, innerY);

    ctx.fillStyle = ink;
    ctx.font = `600 ${sz(16)}px ${fontStack}`;
    const zoneLabel =
      receipt.deliveryZone === 'inside_dhaka'
        ? 'Inside Dhaka'
        : receipt.deliveryZone === 'outside_dhaka'
        ? 'Outside Dhaka'
        : 'Store Pickup';
    ctx.fillText(
      `${zoneLabel}${receipt.courierName ? ` · ${receipt.courierName}` : ''}`,
      rightX,
      innerY + 28
    );

    ctx.fillStyle = muted;
    ctx.font = `400 ${sz(14)}px ${fontStack}`;
    ctx.fillText(`Method: ${receipt.paymentMethod}`, rightX, innerY + 52);
    ctx.fillStyle = accent;
    ctx.font = `700 ${sz(14)}px ${monoStack}`;
    ctx.fillText(`STATUS: ${receipt.status.toUpperCase()}`, rightX, innerY + 76);
    ctx.textAlign = 'left';
  }

  y += customerHeight;

  // --- Items Table Header ---
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(pad, y, contentWidth, tableHeaderHeight, 8);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `600 ${sz(13)}px ${monoStack}`;
  ctx.fillText('ITEM / DESCRIPTION', pad + 16, y + 28);
  if (!isThermal) {
    ctx.textAlign = 'right';
    ctx.fillText('QTY', width - pad - 280, y + 28);
    ctx.fillText('UNIT PRICE', width - pad - 150, y + 28);
    ctx.fillText('TOTAL', width - pad - 16, y + 28);
    ctx.textAlign = 'left';
  } else {
    ctx.textAlign = 'right';
    ctx.fillText('QTY × PRICE', width - pad - 135, y + 28);
    ctx.fillText('TOTAL', width - pad - 16, y + 28);
    ctx.textAlign = 'left';
  }

  y += tableHeaderHeight;

  // --- Line Items ---
  receipt.items.forEach((item, idx) => {
    const rowTop = y + idx * rowHeight;
    if (idx > 0) {
      ctx.strokeStyle = border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(pad, rowTop);
      ctx.lineTo(width - pad, rowTop);
      ctx.stroke();
    }

    ctx.fillStyle = ink;
    ctx.font = `600 ${sz(15)}px ${fontStack}`;
    ctx.fillText(item.name.slice(0, isThermal ? 28 : 46), pad + 16, rowTop + 24);
    if (item.sku) {
      ctx.fillStyle = muted;
      ctx.font = `400 ${sz(12)}px ${monoStack}`;
      ctx.fillText(`SKU: ${item.sku}`, pad + 16, rowTop + 43);
    }

    ctx.textAlign = 'right';
    ctx.fillStyle = muted;
    ctx.font = `400 ${sz(14)}px ${monoStack}`;
    if (!isThermal) {
      ctx.fillText(String(item.qty), width - pad - 280, rowTop + 31);
      ctx.fillText(formatMoney(item.unitPrice, receipt.currency), width - pad - 150, rowTop + 31);
    } else {
      ctx.fillText(
        `${item.qty} × ${formatMoney(item.unitPrice, receipt.currency)}`,
        width - pad - 135,
        rowTop + 31
      );
    }

    ctx.fillStyle = ink;
    ctx.font = `600 ${sz(15)}px ${monoStack}`;
    ctx.fillText(formatMoney(item.total, receipt.currency), width - pad - 16, rowTop + 31);
    ctx.textAlign = 'left';
  });

  y += itemsHeight + 24;

  // --- Totals Box ---
  const totalsWidth = isThermal ? contentWidth : 380;
  const totalsX = width - pad - totalsWidth;

  ctx.strokeStyle = border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(totalsX, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();

  y += 26;
  const drawTotalRow = (label: string, val: string, bold = false, highlight = false) => {
    ctx.fillStyle = highlight ? accent : bold ? ink : muted;
    ctx.font = `${bold ? '700' : '400'} ${sz(bold ? 18 : 14)}px ${fontStack}`;
    ctx.fillText(label, totalsX, y);

    ctx.textAlign = 'right';
    ctx.fillStyle = highlight ? accent : ink;
    ctx.font = `${bold ? '700' : '500'} ${sz(bold ? 20 : 15)}px ${monoStack}`;
    ctx.fillText(val, width - pad, y);
    ctx.textAlign = 'left';
    y += bold ? 32 : 26;
  };

  drawTotalRow('Subtotal', formatMoney(receipt.subtotal, receipt.currency));
  if (receipt.deliveryCharge > 0) {
    drawTotalRow('Delivery Charge', formatMoney(receipt.deliveryCharge, receipt.currency));
  }
  if (receipt.discountAmount > 0) {
    drawTotalRow('Discount', `-${formatMoney(receipt.discountAmount, receipt.currency)}`);
  }
  if (receipt.vatPercent > 0) {
    drawTotalRow(
      `VAT (${receipt.vatPercent}%)`,
      formatMoney(receipt.vatAmount, receipt.currency)
    );
  }

  y += 4;
  drawTotalRow('Grand Total', formatMoney(receipt.grandTotal, receipt.currency), true, true);
  drawTotalRow('Paid Amount', formatMoney(receipt.paidAmount, receipt.currency));
  drawTotalRow('Balance Due', formatMoney(receipt.dueAmount, receipt.currency), true, false);

  // --- Footer Note ---
  y += 28;
  ctx.strokeStyle = border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(width - pad, y);
  ctx.stroke();

  y += 28;
  ctx.fillStyle = muted;
  ctx.font = `400 ${sz(14)}px ${fontStack}`;
  footerLines.forEach((line) => {
    ctx.fillText(line, pad, y);
    y += 22;
  });

  return canvas;
}

export async function downloadReceiptAsPng(
  receipt: CustomerReceiptFormValues
): Promise<void> {
  const canvas = await renderReceiptToCanvas(receipt);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${receipt.receiptNumber}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function downloadReceiptAsPdf(
  receipt: CustomerReceiptFormValues
): Promise<void> {
  const canvas = await renderReceiptToCanvas(receipt);
  const dataUrl = canvas.toDataURL('image/png');
  const isThermal = receipt.paperStyle === 'pos_thermal';

  if (isThermal) {
    const mmWidth = 80;
    const mmHeight = Math.max(110, Math.round(mmWidth * (canvas.height / canvas.width)));
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [mmWidth, mmHeight],
    });
    pdf.addImage(dataUrl, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
    pdf.save(`${receipt.receiptNumber}.pdf`);
    return;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const maxW = pageWidth - margin * 2;
  const maxH = pageHeight - margin * 2;

  const imgRatio = canvas.width / canvas.height;
  let renderW = maxW;
  let renderH = renderW / imgRatio;
  if (renderH > maxH) {
    renderH = maxH;
    renderW = renderH * imgRatio;
  }
  const offsetX = (pageWidth - renderW) / 2;
  pdf.addImage(dataUrl, 'PNG', offsetX, margin, renderW, renderH, undefined, 'FAST');
  pdf.save(`${receipt.receiptNumber}.pdf`);
}
