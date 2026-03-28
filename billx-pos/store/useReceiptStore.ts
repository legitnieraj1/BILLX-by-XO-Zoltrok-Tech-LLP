/**
 * Receipt Template Store
 * Persists receipt template configuration to localStorage.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ReceiptTemplate } from '@/lib/receiptGenerator';

interface ReceiptStoreState {
  template: ReceiptTemplate;
  updateTemplate: (updates: Partial<ReceiptTemplate>) => void;
  resetTemplate: () => void;
}

const DEFAULT_TEMPLATE: ReceiptTemplate = {
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

export const useReceiptStore = create<ReceiptStoreState>()(
  persist(
    (set) => ({
      template: DEFAULT_TEMPLATE,
      updateTemplate: (updates) =>
        set((state) => ({
          template: { ...state.template, ...updates },
        })),
      resetTemplate: () => set({ template: DEFAULT_TEMPLATE }),
    }),
    {
      name: 'billx-receipt-template',
    }
  )
);

export default useReceiptStore;
