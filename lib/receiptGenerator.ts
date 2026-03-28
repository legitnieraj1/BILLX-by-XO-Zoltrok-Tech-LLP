/**
 * Receipt Generator
 * Converts order data + template config into ESC/POS byte commands.
 */

import { EscPosBuilder } from './escpos';

// ─── Types ──────────────────────────────────────────────────────────

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ReceiptData {
  orderNumber: string;
  orderType: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
  dateTime?: Date;
}

export interface ReceiptTemplate {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  footerMessage: string;
  gstNumber: string;
  paperWidth: '58mm' | '80mm';
  showDateTime: boolean;
  showPaymentMethod: boolean;
  showItemList: boolean;
  showTaxBreakdown: boolean;
  showOrderType: boolean;
  showCustomerInfo: boolean;
  showGSTNumber: boolean;
}

// ─── Default Template ───────────────────────────────────────────────

export const DEFAULT_RECEIPT_TEMPLATE: ReceiptTemplate = {
  storeName: 'Cup Culture',
  storeAddress: 'Main Street, City Center',
  storePhone: '+91-9000000000',
  footerMessage: 'Thank you for visiting! See you again.',
  gstNumber: '',
  paperWidth: '80mm',
  showDateTime: true,
  showPaymentMethod: true,
  showItemList: true,
  showTaxBreakdown: true,
  showOrderType: true,
  showCustomerInfo: false,
  showGSTNumber: false,
};

// ─── Generator ──────────────────────────────────────────────────────

export function generateReceipt(
  data: ReceiptData,
  template: ReceiptTemplate = DEFAULT_RECEIPT_TEMPLATE
): string {
  const builder = new EscPosBuilder(template.paperWidth);

  // ── Header ──────────────────────────────────────────────────
  builder.feed(1);
  builder.bigHeader(template.storeName.toUpperCase());

  if (template.storeAddress) {
    builder.centered(template.storeAddress);
  }
  if (template.storePhone) {
    builder.centered(`Tel: ${template.storePhone}`);
  }
  if (template.showGSTNumber && template.gstNumber) {
    builder.centered(`GSTIN: ${template.gstNumber}`);
  }

  builder.divider();

  // ── Order Info ──────────────────────────────────────────────
  builder.bold(true);
  builder.row('Order #', data.orderNumber);
  builder.bold(false);

  if (template.showOrderType) {
    builder.row('Type', data.orderType.toUpperCase());
  }

  if (template.showDateTime) {
    const dt = data.dateTime || new Date();
    const dateStr = dt.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timeStr = dt.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    builder.row('Date', dateStr);
    builder.row('Time', timeStr);
  }

  if (template.showCustomerInfo && data.customerName) {
    builder.row('Customer', data.customerName);
    if (data.customerPhone) {
      builder.row('Phone', data.customerPhone);
    }
  }

  builder.divider();

  // ── Item List ───────────────────────────────────────────────
  if (template.showItemList) {
    builder.bold(true);
    builder.threeCol('ITEM', 'QTY', 'AMOUNT');
    builder.bold(false);
    builder.divider();

    for (const item of data.items) {
      const name = item.name.length > (builder.getColumns() - 16)
        ? item.name.substring(0, builder.getColumns() - 18) + '..'
        : item.name;
      builder.threeCol(
        name,
        `x${item.quantity}`,
        `${item.subtotal.toFixed(2)}`
      );
    }

    builder.divider();
  }

  // ── Totals ──────────────────────────────────────────────────
  builder.row('Subtotal', `${data.subtotal.toFixed(2)}`);

  if (template.showTaxBreakdown && data.tax > 0) {
    builder.row('GST (5%)', `${data.tax.toFixed(2)}`);
  }

  if (data.discount > 0) {
    builder.row('Discount', `-${data.discount.toFixed(2)}`);
  }

  builder.doubleDivider();

  builder.bold(true);
  builder.large(true);
  builder.align('center');
  builder.line(`TOTAL: Rs.${data.total.toFixed(2)}`);
  builder.large(false);
  builder.bold(false);
  builder.align('left');

  builder.doubleDivider();

  // ── Payment Method ──────────────────────────────────────────
  if (template.showPaymentMethod) {
    builder.row('Paid via', data.paymentMethod.toUpperCase());
    builder.emptyLine();
  }

  // ── Footer ──────────────────────────────────────────────────
  if (template.footerMessage) {
    builder.centered(template.footerMessage);
  }
  builder.centered('--- billX POS ---');

  builder.feed(2);
  builder.cut();

  return builder.toBase64();
}

export default generateReceipt;
