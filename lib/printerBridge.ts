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

// ─── Web Bluetooth State Variables ──────────────────────────────────
let webBluetoothDevice: any = null;
let webBluetoothCharacteristic: any = null;

/**
 * Scan for available Bluetooth printers.
 */
export async function scanPrinters(): Promise<PrinterDevice[]> {
  if (!isNative()) {
    try {
      const nav: any = navigator;
      if (!nav.bluetooth) {
        throw new Error("Web Bluetooth API not supported in this browser. Please use Chrome or Edge.");
      }
      const device = await nav.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          '000018f0-0000-1000-8000-00805f9b34fb', // Standard Serial Port / Printer Service
          'e7810a71-73ae-499d-8c15-faa9aef0c3f2'  // Typical alternate POS string
        ]
      });
      // Store globally for connect() phase
      webBluetoothDevice = device;
      
      return [{
        id: device.id,
        name: device.name || 'Web Bluetooth Printer',
        address: device.id,
        type: 'bluetooth',
        paired: false
      }];
    } catch (err: any) {
      console.warn('[PrinterBridge] Web Bluetooth Scan canceled or failed:', err);
      return [];
    }
  }

  const result = await BillxPrinter.scanBluetoothDevices();
  return result.devices;
}

/**
 * Connect to a Bluetooth printer by address.
 */
export async function connectBluetooth(deviceAddress: string): Promise<boolean> {
  if (!isNative()) {
    try {
      if (!webBluetoothDevice) {
        throw new Error("No device selected. Please scan first.");
      }
      
      const server = await webBluetoothDevice.gatt.connect();
      const services = await server.getPrimaryServices();

      // Find the first writable characteristic
      for (const service of services) {
        const characteristics = await service.getCharacteristics();
        for (const char of characteristics) {
          if (char.properties.write || char.properties.writeWithoutResponse) {
            webBluetoothCharacteristic = char;
            
            // Listen for disconnects
            webBluetoothDevice.addEventListener('gattserverdisconnected', () => {
              webBluetoothCharacteristic = null;
              webBluetoothDevice = null;
              console.log("[PrinterBridge] Web Bluetooth disconnected");
            });
            
            return true;
          }
        }
      }
      throw new Error("Could not find a writable thermal printer characteristic.");
    } catch (err: any) {
      console.error('[PrinterBridge] Web Bluetooth Connect Error:', err);
      return false;
    }
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
  if (!isNative()) {
    if (webBluetoothDevice?.gatt?.connected) {
      webBluetoothDevice.gatt.disconnect();
    }
    webBluetoothDevice = null;
    webBluetoothCharacteristic = null;
    return true;
  }
  const result = await BillxPrinter.disconnectPrinter();
  return result.success;
}

/**
 * Send ESC/POS data (base64-encoded) to the printer.
 */
export async function printReceipt(base64Data: string): Promise<boolean> {
  if (!isNative()) {
    if (!webBluetoothCharacteristic) throw new Error("Printer not connected via Web Bluetooth.");
    
    // Decode base64 to binary
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
       bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Chunking to prevent GATT overloading (max 256 bytes per packet is safe)
    const CHUNK_SIZE = 256;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
       await webBluetoothCharacteristic.writeValue(bytes.slice(i, i + CHUNK_SIZE));
       // Small delay to allow printer buffer to catch up
       await new Promise(resolve => setTimeout(resolve, 10));
    }
    return true;
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
    if (webBluetoothDevice && webBluetoothDevice.gatt?.connected) {
      return { 
        status: 'CONNECTED', 
        deviceName: webBluetoothDevice.name || 'Web Bluetooth Printer', 
        deviceAddress: webBluetoothDevice.id, 
        type: 'bluetooth' 
      };
    }
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
    // Basic ESC/POS test receipt (Init + Text + Feed + Cut)
    const testData = "\x1B\x40\n\n=== WEB BLUETOOTH TEST ===\n\nConnection Successful!\n\n\x1B\x64\x05\x1D\x56\x00";
    return printReceipt(btoa(testData));
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
