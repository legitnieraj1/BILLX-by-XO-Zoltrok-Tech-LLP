/**
 * ESC/POS Command Builder
 * Generates raw byte commands for thermal receipt printers (58mm / 80mm).
 * Reference: ESC/POS Application Programming Guide
 */

// ─── Constants ──────────────────────────────────────────────────────

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;
const NULL = 0x00;

// Column widths per paper size
const COLUMNS: Record<string, number> = {
  '58mm': 32,
  '80mm': 48,
};

// ─── Command Builder Class ──────────────────────────────────────────

export class EscPosBuilder {
  private buffer: number[] = [];
  private paperWidth: '58mm' | '80mm';
  private cols: number;

  constructor(paperWidth: '58mm' | '80mm' = '80mm') {
    this.paperWidth = paperWidth;
    this.cols = COLUMNS[paperWidth];
    this.initialize();
  }

  // ── Printer Control ───────────────────────────────────────────

  /** Reset printer to default settings */
  private initialize(): this {
    this.buffer.push(ESC, 0x40); // ESC @
    return this;
  }

  /** Feed n lines */
  feed(lines = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(LF);
    }
    return this;
  }

  /** Cut paper (full cut) */
  cut(): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, 0x00); // GS V 0 (full cut)
    return this;
  }

  /** Partial cut */
  partialCut(): this {
    this.feed(3);
    this.buffer.push(GS, 0x56, 0x01); // GS V 1 (partial cut)
    return this;
  }

  /** Open cash drawer (pulse pin 2) */
  openCashDrawer(): this {
    this.buffer.push(ESC, 0x70, 0x00, 0x19, 0xfa); // ESC p 0
    return this;
  }

  // ── Text Formatting ───────────────────────────────────────────

  /** Set text alignment: 'left' | 'center' | 'right' */
  align(alignment: 'left' | 'center' | 'right'): this {
    const map = { left: 0x00, center: 0x01, right: 0x02 };
    this.buffer.push(ESC, 0x61, map[alignment]);
    return this;
  }

  /** Set bold on/off */
  bold(on = true): this {
    this.buffer.push(ESC, 0x45, on ? 0x01 : 0x00);
    return this;
  }

  /** Set underline on/off */
  underline(on = true): this {
    this.buffer.push(ESC, 0x2d, on ? 0x01 : 0x00);
    return this;
  }

  /** Set double-height text */
  doubleHeight(on = true): this {
    this.buffer.push(ESC, 0x21, on ? 0x10 : 0x00);
    return this;
  }

  /** Set double-width text */
  doubleWidth(on = true): this {
    // GS ! — bit 4 = double height, bit 5 = double width
    this.buffer.push(GS, 0x21, on ? 0x20 : 0x00);
    return this;
  }

  /** Set large text (double height + double width) */
  large(on = true): this {
    this.buffer.push(GS, 0x21, on ? 0x30 : 0x00);
    return this;
  }

  /** Set font size (0 = normal, 1 = double width, 2 = double height, 3 = both) */
  fontSize(size: 0 | 1 | 2 | 3): this {
    const map = [0x00, 0x20, 0x10, 0x30];
    this.buffer.push(GS, 0x21, map[size]);
    return this;
  }

  /** Reset all formatting to default */
  resetFormat(): this {
    this.bold(false);
    this.underline(false);
    this.buffer.push(GS, 0x21, 0x00); // Normal size
    this.align('left');
    return this;
  }

  // ── Text Output ───────────────────────────────────────────────

  /** Write raw text */
  text(content: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(content);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  /** Write text + newline */
  line(content: string): this {
    return this.text(content).feed(1);
  }

  /** Write an empty line */
  emptyLine(): this {
    return this.feed(1);
  }

  // ── Layout Helpers ────────────────────────────────────────────

  /** Print a full-width divider line */
  divider(char = '-'): this {
    return this.line(char.repeat(this.cols));
  }

  /** Print a double divider */
  doubleDivider(): this {
    return this.divider('=');
  }

  /** Print two columns: left-aligned label, right-aligned value */
  row(left: string, right: string): this {
    const gap = this.cols - left.length - right.length;
    if (gap < 1) {
      // Text too long — wrap
      this.line(left);
      this.align('right');
      this.line(right);
      this.align('left');
    } else {
      this.line(left + ' '.repeat(gap) + right);
    }
    return this;
  }

  /** Print three columns: left, center, right */
  threeCol(left: string, center: string, right: string): this {
    const rightPad = Math.max(right.length + 1, 10);
    const centerPad = Math.max(center.length + 1, 5);
    const leftWidth = this.cols - rightPad - centerPad;

    const l = left.substring(0, leftWidth).padEnd(leftWidth);
    const c = center.padStart(centerPad);
    const r = right.padStart(rightPad);
    return this.line(l + c + r);
  }

  /** Center text with padding */
  centered(content: string): this {
    this.align('center');
    this.line(content);
    this.align('left');
    return this;
  }

  /** Bold centered text */
  header(content: string): this {
    this.align('center');
    this.bold(true);
    this.line(content);
    this.bold(false);
    this.align('left');
    return this;
  }

  /** Large bold centered text */
  bigHeader(content: string): this {
    this.align('center');
    this.bold(true);
    this.large(true);
    this.line(content);
    this.large(false);
    this.bold(false);
    this.align('left');
    return this;
  }

  // ── Build Output ──────────────────────────────────────────────

  /** Get raw bytes as Uint8Array */
  build(): Uint8Array {
    return new Uint8Array(this.buffer);
  }

  /** Get as base64 string (for passing through Capacitor bridge) */
  toBase64(): string {
    const bytes = this.build();
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /** Get column count for current paper width */
  getColumns(): number {
    return this.cols;
  }
}

export default EscPosBuilder;
