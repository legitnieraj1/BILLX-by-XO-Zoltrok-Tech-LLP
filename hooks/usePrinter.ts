/**
 * usePrinter Hook
 * React hook providing printer state management and actions.
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PrinterDevice, PrinterStatus, PrinterType } from '@/lib/printerBridge';

interface UsePrinterState {
  status: PrinterStatus;
  deviceName: string | null;
  deviceAddress: string | null;
  printerType: PrinterType | null;
  devices: PrinterDevice[];
  isScanning: boolean;
  isPrinting: boolean;
  error: string | null;
}

interface UsePrinterActions {
  scan: () => Promise<void>;
  connect: (deviceAddress: string) => Promise<boolean>;
  connectUsb: () => Promise<boolean>;
  disconnect: () => Promise<void>;
  print: (base64Data: string) => Promise<boolean>;
  testPrint: () => Promise<boolean>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export type UsePrinterReturn = UsePrinterState & UsePrinterActions;

export function usePrinter(): UsePrinterReturn {
  const [state, setState] = useState<UsePrinterState>({
    status: 'DISCONNECTED',
    deviceName: null,
    deviceAddress: null,
    printerType: null,
    devices: [],
    isScanning: false,
    isPrinting: false,
    error: null,
  });

  const statusInterval = useRef<NodeJS.Timeout | null>(null);

  // ── Load bridge lazily (avoid SSR issues) ─────────────────────

  const getBridge = useCallback(async () => {
    return import('@/lib/printerBridge');
  }, []);

  // ── Refresh Status ────────────────────────────────────────────

  const refreshStatus = useCallback(async () => {
    try {
      const bridge = await getBridge();
      const result = await bridge.getPrinterStatus();
      setState(prev => ({
        ...prev,
        status: result.status,
        deviceName: result.deviceName,
        deviceAddress: result.deviceAddress,
        printerType: result.type,
      }));
    } catch {
      // Silently fail — native plugin may not be available
    }
  }, [getBridge]);

  // ── Auto-connect on mount ─────────────────────────────────────

  useEffect(() => {
    const init = async () => {
      try {
        const bridge = await getBridge();
        await bridge.autoConnect();
        await refreshStatus();
      } catch {
        // Not on native platform — ignore
      }
    };
    init();

    // Poll status every 5 seconds
    statusInterval.current = setInterval(refreshStatus, 5000);
    return () => {
      if (statusInterval.current) clearInterval(statusInterval.current);
    };
  }, [getBridge, refreshStatus]);

  // ── Scan ──────────────────────────────────────────────────────

  const scan = useCallback(async () => {
    setState(prev => ({ ...prev, isScanning: true, error: null }));
    try {
      const bridge = await getBridge();
      const devices = await bridge.scanPrinters();
      setState(prev => ({ ...prev, devices, isScanning: false }));
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isScanning: false,
        error: err.message || 'Scan failed',
      }));
    }
  }, [getBridge]);

  // ── Connect Bluetooth ─────────────────────────────────────────

  const connect = useCallback(async (deviceAddress: string): Promise<boolean> => {
    setState(prev => ({ ...prev, status: 'CONNECTING', error: null }));
    try {
      const bridge = await getBridge();
      const success = await bridge.connectBluetooth(deviceAddress);
      if (success) {
        await bridge.setDefaultPrinter(deviceAddress, 'bluetooth');
      }
      await refreshStatus();
      return success;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: 'ERROR',
        error: err.message || 'Connection failed',
      }));
      return false;
    }
  }, [getBridge, refreshStatus]);

  // ── Connect USB ───────────────────────────────────────────────

  const connectUsb = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, status: 'CONNECTING', error: null }));
    try {
      const bridge = await getBridge();
      const success = await bridge.connectUSB();
      if (success) {
        await bridge.setDefaultPrinter('usb-auto', 'usb');
      }
      await refreshStatus();
      return success;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        status: 'ERROR',
        error: err.message || 'USB connection failed',
      }));
      return false;
    }
  }, [getBridge, refreshStatus]);

  // ── Disconnect ────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    try {
      const bridge = await getBridge();
      await bridge.disconnectPrinter();
      setState(prev => ({
        ...prev,
        status: 'DISCONNECTED',
        deviceName: null,
        deviceAddress: null,
        printerType: null,
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [getBridge]);

  // ── Print ─────────────────────────────────────────────────────

  const print = useCallback(async (base64Data: string): Promise<boolean> => {
    setState(prev => ({ ...prev, isPrinting: true, error: null }));
    try {
      const bridge = await getBridge();
      const success = await bridge.printReceipt(base64Data);
      setState(prev => ({ ...prev, isPrinting: false }));
      return success;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isPrinting: false,
        error: err.message || 'Print failed',
      }));
      return false;
    }
  }, [getBridge]);

  // ── Test Print ────────────────────────────────────────────────

  const doPrintTest = useCallback(async (): Promise<boolean> => {
    setState(prev => ({ ...prev, isPrinting: true, error: null }));
    try {
      const bridge = await getBridge();
      const success = await bridge.testPrint();
      setState(prev => ({ ...prev, isPrinting: false }));
      return success;
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isPrinting: false,
        error: err.message || 'Test print failed',
      }));
      return false;
    }
  }, [getBridge]);

  // ── Clear Error ───────────────────────────────────────────────

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    scan,
    connect,
    connectUsb,
    disconnect,
    print,
    testPrint: doPrintTest,
    refreshStatus,
    clearError,
  };
}

export default usePrinter;
