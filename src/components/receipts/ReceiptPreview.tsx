import React from 'react';
import { CustomerReceiptFormValues } from '../../lib/validators/schemas';
import { cn, formatMoney, isEkTallyLogo, resolveReceiptLogoUrl } from '../../lib/utils';

interface ReceiptPreviewProps {
  receipt: CustomerReceiptFormValues;
}

const ZONE_LABELS = {
  inside_dhaka: 'Inside Dhaka',
  outside_dhaka: 'Outside Dhaka',
  pickup: 'Store Pickup',
} as const;

const STATUS_LABELS = {
  paid: 'PAID',
  partial: 'PARTIAL',
  cod: 'COD DUE',
  unpaid: 'UNPAID',
} as const;

function isDarkHex(hex: string): boolean {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.52;
}

export const ReceiptPreview: React.FC<ReceiptPreviewProps> = ({ receipt }) => {
  const isThermal = receipt.paperStyle === 'pos_thermal';
  const isDark = receipt.paperStyle === 'dark_luxury';
  const accent = /^#[0-9a-fA-F]{6}$/.test(receipt.accentColor)
    ? receipt.accentColor
    : '#16a34a';
  const headerBg = /^#[0-9a-fA-F]{6}$/.test(receipt.headerBgColor)
    ? receipt.headerBgColor
    : isDark
    ? '#121214'
    : '#f8fafc';
  const headerIsDark = isDarkHex(headerBg);

  const fontClass =
    receipt.textStyle === 'classic_serif'
      ? 'font-serif'
      : receipt.textStyle === 'mono_thermal'
      ? 'font-mono'
      : 'font-sans';

  const scaleClass =
    receipt.fontSizeScale === 'sm'
      ? 'text-[13px]'
      : receipt.fontSizeScale === 'lg'
      ? 'text-[15px]'
      : 'text-sm';

  const logoDimClass =
    receipt.logoSize === 'sm'
      ? 'w-10 h-10 text-sm'
      : receipt.logoSize === 'lg'
      ? 'w-18 h-18 text-xl'
      : 'w-14 h-14 text-base';

  const uploadedLogoClass =
    receipt.logoSize === 'sm'
      ? 'h-10 max-w-[130px]'
      : receipt.logoSize === 'lg'
      ? 'h-16 max-w-[200px]'
      : 'h-12 max-w-[160px]';

  const isCentered = receipt.logoPosition === 'center' && !isThermal;

  const monogram = (
    receipt.logoText.trim() ||
    receipt.businessName.trim().slice(0, 2) ||
    'BD'
  ).toUpperCase();

  const dateTimeStr = [receipt.issueDate, receipt.issueTime].filter(Boolean).join(' · ');

  return (
    <div
      id="printable-receipt"
      className={cn(
        'w-full mx-auto rounded-xl overflow-hidden border transition-all shadow-2xl',
        fontClass,
        scaleClass,
        isThermal ? 'max-w-[390px]' : 'max-w-[720px]',
        isDark
          ? 'bg-[#09090b] text-zinc-100 border-[#27272a]'
          : 'bg-white text-slate-900 border-slate-200'
      )}
    >
      {/* Top brand accent stripe */}
      <div className="h-2 w-full" style={{ backgroundColor: accent }} />

      {/* Header Band with customizable background */}
      <div
        className={cn(
          'border-b',
          isThermal ? 'px-4 py-4 sm:px-5' : 'px-4 py-4 sm:px-9 sm:py-6',
          isDark ? 'border-zinc-800' : 'border-slate-200',
          isThermal && 'border-dashed'
        )}
        style={{ backgroundColor: headerBg }}
      >
        <div
          className={cn(
            'flex gap-4',
            isCentered
              ? 'flex-col items-center text-center'
              : isThermal
              ? 'flex-col'
              : 'flex-col sm:flex-row sm:items-start sm:justify-between'
          )}
        >
          <div
            className={cn(
              'flex gap-3.5 min-w-0',
              isCentered ? 'flex-col items-center text-center' : 'items-start'
            )}
          >
            {receipt.logoType === 'uploaded' && receipt.logoDataUrl ? (
              <img
                src={resolveReceiptLogoUrl(receipt.logoDataUrl, headerIsDark)}
                alt={receipt.businessName || 'Business Logo'}
                className={cn(
                  'w-auto object-contain shrink-0',
                  uploadedLogoClass,
                  isEkTallyLogo(receipt.logoDataUrl)
                    ? ''
                    : cn('rounded-lg border', headerIsDark ? 'border-zinc-700' : 'border-slate-200')
                )}
              />
            ) : receipt.logoType === 'monogram' ? (
              <div
                className={cn(
                  'rounded-lg flex items-center justify-center font-bold text-white shrink-0 tracking-tight',
                  logoDimClass
                )}
                style={{ backgroundColor: accent }}
              >
                {monogram}
              </div>
            ) : null}

            <div className="min-w-0">
              <h2
                className={cn(
                  'font-bold tracking-tight leading-snug break-words',
                  receipt.fontSizeScale === 'lg'
                    ? 'text-2xl'
                    : receipt.fontSizeScale === 'sm'
                    ? 'text-lg'
                    : 'text-xl',
                  headerIsDark ? 'text-zinc-100' : 'text-slate-900'
                )}
              >
                {receipt.businessName || 'Your Business Name'}
              </h2>
              {receipt.businessTagline && (
                <p
                  className={cn(
                    'text-xs mt-0.5',
                    headerIsDark ? 'text-zinc-400' : 'text-slate-600'
                  )}
                >
                  {receipt.businessTagline}
                </p>
              )}
              {(receipt.businessPhone || receipt.businessAddress) && (
                <p
                  className={cn(
                    'text-xs mt-1.5 leading-relaxed',
                    headerIsDark ? 'text-zinc-400' : 'text-slate-600'
                  )}
                >
                  {[receipt.businessPhone, receipt.businessAddress]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div
            className={cn(
              isCentered
                ? 'text-center pt-1'
                : isThermal
                ? 'text-left'
                : 'sm:text-right shrink-0'
            )}
          >
            <p
              className="text-[11px] font-mono font-bold tracking-wider uppercase"
              style={{ color: accent }}
            >
              {receipt.memoTitle || 'Official Receipt'}
            </p>
            <p
              className={cn(
                'text-sm font-mono font-semibold mt-0.5 tabular-nums',
                headerIsDark ? 'text-zinc-100' : 'text-slate-900'
              )}
            >
              {receipt.receiptNumber || 'INV-BD-0001'}
            </p>
            <p
              className={cn(
                'text-xs font-mono mt-0.5 tabular-nums',
                headerIsDark ? 'text-zinc-400' : 'text-slate-600'
              )}
            >
              {dateTimeStr}
            </p>
          </div>
        </div>
      </div>

      <div className={cn(isThermal ? 'p-4 space-y-4 sm:p-5' : 'p-4 space-y-4 sm:p-9 sm:space-y-6')}>
        {/* Customer & Delivery Panel */}
        <div
          className={cn(
            'rounded-lg border p-4 grid gap-4',
            isThermal ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2',
            isDark
              ? 'bg-[#18181b] border-zinc-800'
              : 'bg-slate-50 border-slate-200'
          )}
        >
          <div className="min-w-0">
            <p
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              Billed To / Customer
            </p>
            <p className="text-sm font-semibold mt-1 break-words">
              {receipt.customerName || 'Customer Name'}
            </p>
            {(receipt.customerPhone || receipt.customerEmail) && (
              <p
                className={cn(
                  'text-xs mt-1 break-words tabular-nums',
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                )}
              >
                {[receipt.customerPhone, receipt.customerEmail]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
            {(receipt.customerAddress || receipt.customerDistrict) && (
              <p
                className={cn(
                  'text-xs mt-1 leading-relaxed break-words',
                  isDark ? 'text-zinc-400' : 'text-slate-600'
                )}
              >
                {[receipt.customerAddress, receipt.customerDistrict]
                  .filter(Boolean)
                  .join(', ')}
              </p>
            )}
          </div>

          <div
            className={cn(
              isThermal ? 'text-left pt-3 border-t border-dashed' : 'sm:text-right',
              isDark ? 'border-zinc-800' : 'border-slate-200'
            )}
          >
            <p
              className="text-[11px] font-mono font-bold uppercase tracking-wider"
              style={{ color: accent }}
            >
              Delivery &amp; Payment
            </p>
            <p className="text-sm font-semibold mt-1">
              {ZONE_LABELS[receipt.deliveryZone]}
              {receipt.courierName ? ` · ${receipt.courierName}` : ''}
            </p>
            <p
              className={cn(
                'text-xs mt-1',
                isDark ? 'text-zinc-400' : 'text-slate-600'
              )}
            >
              Method: {receipt.paymentMethod}
            </p>
            <p
              className="text-xs font-mono font-bold mt-1.5 tracking-wide"
              style={{ color: accent }}
            >
              STATUS: {STATUS_LABELS[receipt.status]}
            </p>
          </div>
        </div>

        {/* Line Items Table */}
        <div>
          <div
            className="rounded-md px-2 sm:px-3.5 py-2 text-[10px] sm:text-[11px] font-mono font-semibold uppercase tracking-wider text-white grid grid-cols-12 gap-1 sm:gap-2 items-center"
            style={{ backgroundColor: accent }}
          >
            <div className={cn(isThermal ? 'col-span-6' : 'col-span-5 sm:col-span-6')}>Item</div>
            {!isThermal && <div className="col-span-2 text-right">Qty</div>}
            <div className={cn(isThermal ? 'col-span-3 text-right' : 'col-span-2 text-right')}>
              {isThermal ? 'Rate' : 'Unit'}
            </div>
            <div
              className={cn(
                isThermal ? 'col-span-3 text-right' : 'col-span-3 sm:col-span-2 text-right'
              )}
            >
              Total
            </div>
          </div>

          <div
            className={cn(
              'divide-y',
              isDark ? 'divide-zinc-800' : 'divide-slate-200',
              isThermal && 'divide-dashed'
            )}
          >
            {receipt.items.map((item, idx) => (
              <div
                key={idx}
                className="px-2 sm:px-3.5 py-2.5 grid grid-cols-12 gap-1 sm:gap-2 items-center text-[11px] sm:text-xs"
              >
                <div className={cn(isThermal ? 'col-span-6' : 'col-span-5 sm:col-span-6', 'min-w-0')}>
                  <p className="font-medium break-words">
                    {item.name || 'Product Item'}
                  </p>
                  <p
                    className={cn(
                      'text-[11px] font-mono mt-0.5',
                      isDark ? 'text-zinc-500' : 'text-slate-500'
                    )}
                  >
                    {isThermal
                      ? `${item.qty} × ${formatMoney(item.unitPrice, receipt.currency)}${item.sku ? ` · ${item.sku}` : ''}`
                      : item.sku
                      ? `SKU: ${item.sku}`
                      : ''}
                  </p>
                </div>

                {!isThermal && (
                  <div
                    className={cn(
                      'col-span-2 text-right font-mono tabular-nums',
                      isDark ? 'text-zinc-300' : 'text-slate-600'
                    )}
                  >
                    {item.qty}
                  </div>
                )}

                <div
                  className={cn(
                    isThermal ? 'col-span-3' : 'col-span-2',
                    'text-right font-mono tabular-nums',
                    isDark ? 'text-zinc-300' : 'text-slate-600'
                  )}
                >
                  {formatMoney(item.unitPrice, receipt.currency)}
                </div>

                <div
                  className={cn(
                    isThermal ? 'col-span-3' : 'col-span-3 sm:col-span-2',
                    'text-right font-mono font-semibold tabular-nums'
                  )}
                >
                  {formatMoney(item.total, receipt.currency)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div
          className={cn(
            'pt-4 border-t flex justify-end',
            isDark ? 'border-zinc-800' : 'border-slate-200',
            isThermal && 'border-dashed'
          )}
        >
          <div className={cn('space-y-1.5 text-xs', isThermal ? 'w-full' : 'w-full sm:w-72')}>
            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Subtotal</span>
              <span className="font-mono font-medium tabular-nums">
                {formatMoney(receipt.subtotal, receipt.currency)}
              </span>
            </div>

            {receipt.deliveryCharge > 0 && (
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                  Delivery Charge
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {formatMoney(receipt.deliveryCharge, receipt.currency)}
                </span>
              </div>
            )}

            {receipt.discountAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Discount</span>
                <span className="font-mono font-medium tabular-nums">
                  -{formatMoney(receipt.discountAmount, receipt.currency)}
                </span>
              </div>
            )}

            {receipt.vatPercent > 0 && (
              <div className="flex items-center justify-between">
                <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>
                  VAT ({receipt.vatPercent}%)
                </span>
                <span className="font-mono font-medium tabular-nums">
                  {formatMoney(receipt.vatAmount, receipt.currency)}
                </span>
              </div>
            )}

            <div
              className={cn(
                'pt-2 mt-2 border-t flex items-center justify-between text-sm font-bold',
                isDark ? 'border-zinc-800' : 'border-slate-200'
              )}
            >
              <span style={{ color: accent }}>Grand Total</span>
              <span className="font-mono text-base tabular-nums" style={{ color: accent }}>
                {formatMoney(receipt.grandTotal, receipt.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className={isDark ? 'text-zinc-400' : 'text-slate-500'}>Paid Amount</span>
              <span className="font-mono font-medium tabular-nums">
                {formatMoney(receipt.paidAmount, receipt.currency)}
              </span>
            </div>

            <div className="flex items-center justify-between font-semibold">
              <span>Balance Due</span>
              <span className="font-mono tabular-nums">
                {formatMoney(receipt.dueAmount, receipt.currency)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        {receipt.footerNote && (
          <div
            className={cn(
              'pt-4 border-t text-xs leading-relaxed',
              isDark ? 'border-zinc-800 text-zinc-400' : 'border-slate-200 text-slate-500',
              isThermal && 'border-dashed text-center'
            )}
          >
            {receipt.footerNote}
          </div>
        )}
      </div>
    </div>
  );
};
