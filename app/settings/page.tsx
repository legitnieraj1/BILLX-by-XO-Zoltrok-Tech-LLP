"use client";

import { useState } from "react";
import { usePrinter } from "@/hooks/usePrinter";
import { useReceiptStore } from "@/store/useReceiptStore";
import { usePosStore } from "@/store/usePosStore";
import clsx from "clsx";

export default function SettingsPage() {
  const printer = usePrinter();
  const { template, updateTemplate, resetTemplate } = useReceiptStore();
  const [activeTab, setActiveTab] = useState<'general' | 'printer' | 'receipt'>('general');

  const statusColor = {
    CONNECTED: 'bg-emerald-500',
    DISCONNECTED: 'bg-slate-300',
    CONNECTING: 'bg-amber-400 animate-pulse',
    ERROR: 'bg-rose-500',
  };

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-12 bg-surface">
      <header className="px-8 py-6 mb-2">
        <h2 className="text-2xl font-black tracking-tighter text-[#022448]">Settings</h2>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage printer, receipt template, and device preferences.</p>
      </header>

      {/* Tab Toggle */}
      <div className="px-8 mb-8">
        <div className="flex bg-surface-container-high rounded-full p-1 h-10 w-fit">
          {[
            { id: 'general' as const, label: 'General', icon: 'tune' },
            { id: 'printer' as const, label: 'Printer', icon: 'print' },
            { id: 'receipt' as const, label: 'Receipt Template', icon: 'receipt_long' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-5 py-1.5 text-xs rounded-full transition-colors flex items-center gap-2",
                activeTab === tab.id
                  ? "bg-white shadow-sm text-primary font-bold"
                  : "font-medium text-slate-500 hover:text-primary"
              )}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-8 space-y-6">
        {activeTab === 'general' ? (
          <GeneralSettings />
        ) : activeTab === 'printer' ? (
          <PrinterSettings printer={printer} />
        ) : (
          <ReceiptTemplateEditor
            template={template}
            onUpdate={updateTemplate}
            onReset={resetTemplate}
          />
        )}
      </div>
    </div>
  );
}

// ─── General Settings Panel ─────────────────────────────────────────

function GeneralSettings() {
  const { globalTaxRate, setGlobalTaxRate } = usePosStore();

  return (
    <>
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-primary mb-1">Store Configuration</h3>
          <p className="text-sm text-slate-500">Global billing and checkout variables.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="GST Percentage (%)"
            value={(globalTaxRate * 100).toString()}
            onChange={(v) => {
              // Allow raw input, parse later or only allow numbers
              const val = parseFloat(v);
              if (!isNaN(val)) {
                setGlobalTaxRate(val / 100);
              } else if (v === '') {
                setGlobalTaxRate(0);
              }
            }}
            placeholder="e.g. 5"
          />
        </div>
      </div>
    </>
  );
}

// ─── Printer Settings Panel ─────────────────────────────────────────

function PrinterSettings({ printer }: { printer: ReturnType<typeof usePrinter> }) {
  const statusColor: Record<string, string> = {
    CONNECTED: 'bg-emerald-500',
    DISCONNECTED: 'bg-slate-300',
    CONNECTING: 'bg-amber-400 animate-pulse',
    ERROR: 'bg-rose-500',
  };

  const statusLabel: Record<string, string> = {
    CONNECTED: 'Connected',
    DISCONNECTED: 'Disconnected',
    CONNECTING: 'Connecting...',
    ERROR: 'Error',
  };

  return (
    <>
      {/* Connection Status Card */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-primary mb-1">Printer Connection</h3>
            <p className="text-sm text-slate-500">Current thermal printer status</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={clsx("w-3 h-3 rounded-full", statusColor[printer.status])} />
            <span className={clsx(
              "text-xs font-bold uppercase tracking-wider",
              printer.status === 'CONNECTED' ? 'text-emerald-600' : 'text-slate-500'
            )}>
              {statusLabel[printer.status]}
            </span>
          </div>
        </div>

        {printer.status === 'CONNECTED' && (
          <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-2xl">print</span>
              <div>
                <p className="text-sm font-bold text-emerald-800">{printer.deviceName || 'Thermal Printer'}</p>
                <p className="text-[10px] text-emerald-600 font-mono">{printer.deviceAddress}</p>
              </div>
              <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                {printer.printerType === 'usb' ? 'USB' : 'Bluetooth'}
              </span>
            </div>
          </div>
        )}

        {printer.error && (
          <div className="bg-rose-50 rounded-xl p-4 mb-6 border border-rose-100 flex items-center gap-3">
            <span className="material-symbols-outlined text-rose-500">error</span>
            <p className="text-sm text-rose-700">{printer.error}</p>
            <button onClick={printer.clearError} className="ml-auto text-rose-400 hover:text-rose-600">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          {printer.status === 'CONNECTED' ? (
            <>
              <ActionButton
                icon="print"
                label={printer.isPrinting ? "Printing..." : "Test Print"}
                onClick={() => printer.testPrint()}
                disabled={printer.isPrinting}
                variant="primary"
              />
              <ActionButton
                icon="bluetooth_disabled"
                label="Disconnect"
                onClick={() => printer.disconnect()}
                variant="danger"
              />
            </>
          ) : (
            <>
              <ActionButton
                icon="bluetooth_searching"
                label={printer.isScanning ? "Scanning..." : "Scan Bluetooth"}
                onClick={() => printer.scan()}
                disabled={printer.isScanning}
                variant="primary"
              />
              <ActionButton
                icon="usb"
                label="Connect USB"
                onClick={() => printer.connectUsb()}
                variant="secondary"
              />
            </>
          )}
        </div>
      </div>

      {/* Available Devices List */}
      {printer.devices.length > 0 && printer.status !== 'CONNECTED' && (
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
          <h3 className="text-lg font-bold text-primary mb-6">Available Devices</h3>
          <div className="space-y-3">
            {printer.devices.map((device) => (
              <button
                key={device.id}
                onClick={() => printer.connect(device.address)}
                disabled={printer.status === 'CONNECTING'}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface hover:bg-surface-container-high border border-outline-variant/10 transition-all group"
              >
                <span className="material-symbols-outlined text-primary text-xl group-hover:scale-110 transition-transform">
                  {device.type === 'usb' ? 'usb' : 'bluetooth'}
                </span>
                <div className="text-left flex-1">
                  <p className="text-sm font-bold text-primary">{device.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{device.address}</p>
                </div>
                {device.paired && (
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-2 py-1 rounded-full">
                    Paired
                  </span>
                )}
                <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Receipt Template Editor ────────────────────────────────────────

function ReceiptTemplateEditor({
  template,
  onUpdate,
  onReset,
}: {
  template: any;
  onUpdate: (updates: any) => void;
  onReset: () => void;
}) {
  return (
    <>
      {/* Store Information */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
        <h3 className="text-lg font-bold text-primary mb-6">Store Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SettingsInput
            label="Store Name"
            value={template.storeName}
            onChange={(v) => onUpdate({ storeName: v })}
          />
          <SettingsInput
            label="Phone Number"
            value={template.storePhone}
            onChange={(v) => onUpdate({ storePhone: v })}
          />
          <SettingsInput
            label="Address"
            value={template.storeAddress}
            onChange={(v) => onUpdate({ storeAddress: v })}
            className="md:col-span-2"
          />
          <SettingsInput
            label="GST Number"
            value={template.gstNumber}
            onChange={(v) => onUpdate({ gstNumber: v })}
            placeholder="e.g. 22AAAAA0000A1Z5"
          />
          <SettingsInput
            label="Footer Message"
            value={template.footerMessage}
            onChange={(v) => onUpdate({ footerMessage: v })}
          />
        </div>
      </div>

      {/* Paper & Display Settings */}
      <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
        <h3 className="text-lg font-bold text-primary mb-6">Receipt Layout</h3>

        {/* Paper Width */}
        <div className="mb-6">
          <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Paper Width</label>
          <div className="flex gap-3">
            {(['58mm', '80mm'] as const).map((w) => (
              <button
                key={w}
                onClick={() => onUpdate({ paperWidth: w })}
                className={clsx(
                  "px-6 py-2 rounded-xl text-sm font-bold transition-all",
                  template.paperWidth === w
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-container-high text-slate-600 hover:bg-surface-container-highest"
                )}
              >
                {w}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Switches */}
        <div className="space-y-4">
          <SettingsToggle
            label="Show Date & Time"
            value={template.showDateTime}
            onChange={(v) => onUpdate({ showDateTime: v })}
          />
          <SettingsToggle
            label="Show Payment Method"
            value={template.showPaymentMethod}
            onChange={(v) => onUpdate({ showPaymentMethod: v })}
          />
          <SettingsToggle
            label="Show Item List"
            value={template.showItemList}
            onChange={(v) => onUpdate({ showItemList: v })}
          />
          <SettingsToggle
            label="Show Tax Breakdown"
            value={template.showTaxBreakdown}
            onChange={(v) => onUpdate({ showTaxBreakdown: v })}
          />
          <SettingsToggle
            label="Show Order Type"
            value={template.showOrderType}
            onChange={(v) => onUpdate({ showOrderType: v })}
          />
          <SettingsToggle
            label="Show Customer Info"
            value={template.showCustomerInfo}
            onChange={(v) => onUpdate({ showCustomerInfo: v })}
          />
          <SettingsToggle
            label="Show GST Number"
            value={template.showGSTNumber}
            onChange={(v) => onUpdate({ showGSTNumber: v })}
          />
        </div>
      </div>

      {/* Reset */}
      <div className="flex justify-end">
        <button
          onClick={onReset}
          className="px-6 py-2.5 text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors"
        >
          Reset to Defaults
        </button>
      </div>
    </>
  );
}

// ─── Reusable Components ────────────────────────────────────────────

function ActionButton({
  icon,
  label,
  onClick,
  disabled,
  variant = 'primary',
}: {
  icon: string;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}) {
  const styles = {
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'bg-surface-container-high text-primary hover:bg-surface-container-highest',
    danger: 'bg-rose-50 text-rose-600 hover:bg-rose-100',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50",
        styles[variant]
      )}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label}
    </button>
  );
}

function SettingsInput({
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2 block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl bg-surface-container-high border border-outline-variant/10 text-sm font-medium text-primary focus:outline-none focus:border-primary/30 transition-colors"
      />
    </div>
  );
}

function SettingsToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={clsx(
          "w-11 h-6 rounded-full transition-colors relative",
          value ? "bg-primary" : "bg-slate-200"
        )}
      >
        <div
          className={clsx(
            "w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
            value ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}
