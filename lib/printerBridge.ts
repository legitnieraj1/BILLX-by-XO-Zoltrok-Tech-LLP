/**
 * Printer Bridge
 * Communicates with the native Kotlin Capacitor plugin (BillxPrinter).
 * Falls back gracefully when running in browser (non-native).
 */

import { Capacitor, registerPlugin } from '@capacitor/core';

// ─── Types ──────────────────────────────────────────────────────────

export type PrinterStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'ERROR';
export type PrinterType = 'bluetooth' | 'usb';

export interface PrinterDevice {
  id: string;
  name: string;
  address: string;
  type: PrinterType;
  paired: boolean;
}

export interface PrinterStatusResult {
  status: PrinterStatus;
  deviceName: string | null;
  deviceAddress: string | null;
  type: PrinterType | null;
}

export interface ScanResult {
  devices: PrinterDevice[];
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

// ─── Plugin Interface ───────────────────────────────────────────────

interface BillxPrinterPlugin {
  scanBluetoothDevices(): Promise<ScanResult>;
  connectBluetoothPrinter(options: { deviceAddress: string }): Promise<PrintResult>;
  connectUSBPrinter(): Promise<PrintResult>;
  disconnectPrinter(): Promise<PrintResult>;
  printReceipt(options: { data: string }): Promise<PrintResult>;
  getPrinterStatus(): Promise<PrinterStatusResult>;
  getDefaultPrinter(): Promise<{ address: string | null; type: PrinterType | null }>;
  setDefaultPrinter(options: { address: string; type: PrinterType }): Promise<void>;
  testPrint(): Promise<PrintResult>;
}

// ─── Register Plugin ────────────────────────────────────────────────

const BillxPrinter = registerPlugin<BillxPrinterPlugin>('BillxPrinter');

// ─── Bridge Functions ───────────────────────────────────────────────

function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Scan for available Bluetooth printers.
 */
export async function scanPrinters(): Promise<PrinterDevice[]> {
  if (!isNative()) {
    console.warn('[PrinterBridge] Not running on native platform — scan unavailable');
    return [];
  }

  const result = await BillxPrinter.scanBluetoothDevices();
  return result.devices;
}

/**
 * Connect to a Bluetooth printer by address.
 */
export async function connectBluetooth(deviceAddress: string): Promise<boolean> {
  if (!isNative()) {
    console.warn('[PrinterBridge] Not running on native platform');
    return false;
  }

  const result = await BillxPrinter.connectBluetoothPrinter({ deviceAddress });
  return result.success;
}

/**
 * Connect to a USB printer (auto-detected).
 */
export async function connectUSB(): Promise<boolean> {
  if (!isNative()) {
    console.warn('[PrinterBridge] Not running on native platform');
    return false;
  }

  const result = await BillxPrinter.connectUSBPrinter();
  return result.success;
}

/**
 * Disconnect the current printer.
 */
export async function disconnectPrinter(): Promise<boolean> {
  if (!isNative()) return true;
  const result = await BillxPrinter.disconnectPrinter();
  return result.success;
}

/**
 * Send ESC/POS data (base64-encoded) to the printer.
 */
export async function printReceipt(base64Data: string): Promise<boolean> {
  if (!isNative()) {
    console.warn('[PrinterBridge] Not running on native platform — printing to console');
    console.log('[PrinterBridge] Receipt data (base64):', base64Data.substring(0, 100) + '...');
    return true; // Simulate success in browser
  }

  const result = await BillxPrinter.printReceipt({ data: base64Data });
  if (!result.success) {
    throw new Error(result.error || 'Print failed');
  }
  return true;
}

/**
 * Get current printer connection status.
 */
export async function getPrinterStatus(): Promise<PrinterStatusResult> {
  if (!isNative()) {
    return {
      status: 'DISCONNECTED',
      deviceName: null,
      deviceAddress: null,
      type: null,
    };
  }

  return BillxPrinter.getPrinterStatus();
}

/**
 * Get saved default printer from device storage.
 */
export async function getDefaultPrinter(): Promise<{ address: string | null; type: PrinterType | null }> {
  if (!isNative()) return { address: null, type: null };
  return BillxPrinter.getDefaultPrinter();
}

/**
 * Save a printer as default (persisted to device storage).
 */
export async function setDefaultPrinter(address: string, type: PrinterType): Promise<void> {
  if (!isNative()) return;
  await BillxPrinter.setDefaultPrinter({ address, type });
}

/**
 * Print a test page.
 */
export async function testPrint(): Promise<boolean> {
  if (!isNative()) {
    console.log('[PrinterBridge] Test print (browser mode)');
    return true;
  }

  const result = await BillxPrinter.testPrint();
  return result.success;
}

/**
 * Auto-connect to the saved default printer on app launch.
 */
export async function autoConnect(): Promise<boolean> {
  if (!isNative()) return false;

  try {
    const saved = await getDefaultPrinter();
    if (!saved.address) return false;

    if (saved.type === 'bluetooth') {
      return await connectBluetooth(saved.address);
    } else if (saved.type === 'usb') {
      return await connectUSB();
    }
  } catch (err) {
    console.warn('[PrinterBridge] Auto-connect failed:', err);
  }
  return false;
}
