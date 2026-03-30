import { create } from 'zustand';
import { Bill, Product, CartItem, OrderType, PaymentMethod, Customer, Modifier, Variant } from '@/types';

interface PosState {
  // Authentication / App State
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // Data State (Mocked initially)
  products: Product[];
  categories: string[];
  setProducts: (items: Product[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Terminal / Bill State
  globalTaxRate: number;
  setGlobalTaxRate: (rate: number) => void;
  bills: Bill[];
  activeBillId: string | null;
  addBill: () => void;
  removeBill: (id: string) => void;
  setActiveBill: (id: string) => void;
  
  // Active Bill Actions
  addCartItem: (product: Product, variant?: Variant, modifiers?: Modifier[]) => void;
  removeCartItem: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  
  setOrderType: (type: OrderType) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCustomerDetails: (customer: Customer) => void;
  
  // Getter for current active bill
  getActiveBill: () => Bill | undefined;
}

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateOrderNumber = () => Math.floor(1000 + Math.random() * 9000).toString();

const createNewBill = (index: number, deterministicId?: string, taxRate: number = 0.05): Bill => ({
  id: deterministicId || `bill-${Date.now()}-${generateId()}`,
  label: `Bill ${index + 1}`,
  orderNumber: deterministicId ? "1001" : generateOrderNumber(),
  orderType: 'dine-in',
  customer: { name: '', phone: '' },
  items: [],
  paymentMethod: 'cash',
  discount: 0,
  taxRate,
  status: 'pending',
  createdAt: new Date('2024-01-01'), // Deterministic date for initial state
});

export const usePosStore = create<PosState>((set, get) => {
  const initialBill = createNewBill(0, 'default-bill-1', 0.05);
  
  return {
    sidebarOpen: true,
    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    
    products: [],
    categories: ['Coffee', 'Tea', 'Snacks', 'Desserts', 'Combos'],
    setProducts: (products) => set({ products }),
    searchQuery: '',
    setSearchQuery: (query) => set({ searchQuery: query }),
    
    bills: [initialBill],
    activeBillId: initialBill.id,
    
    globalTaxRate: 0.05,
    setGlobalTaxRate: (rate: number) => set((state) => ({
      globalTaxRate: rate,
      bills: state.bills.map((b) => b.status === 'pending' ? { ...b, taxRate: rate } : b)
    })),
    
    addBill: () => set((state) => {
      const newBill = createNewBill(state.bills.length, undefined, state.globalTaxRate);
      return {
        bills: [...state.bills, newBill],
        activeBillId: newBill.id,
      };
    }),
    
    removeBill: (id) => set((state) => {
      if (state.bills.length <= 1) return state; // Don't remove last bill
      
      const newBills = state.bills.filter(b => b.id !== id);
      // If we removed the active bill, set the last one as active
      const nextActiveId = state.activeBillId === id ? newBills[newBills.length - 1].id : state.activeBillId;
      
      return {
        bills: newBills,
        activeBillId: nextActiveId,
      };
    }),
    
    setActiveBill: (id) => set({ activeBillId: id }),
    
    getActiveBill: () => {
      const { bills, activeBillId } = get();
      return bills.find((b) => b.id === activeBillId);
    },
    
    addCartItem: (product, variant, modifiers) => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const activeBill = bills[activeBillIndex];
      const modifiersTotal = modifiers?.reduce((sum, mod) => sum + mod.priceAdjustment, 0) || 0;
      const variantTotal = variant?.priceAdjustment || 0;
      const unitPrice = product.price + modifiersTotal + variantTotal;
      
      const newCartItem: CartItem = {
        id: `item-${Date.now()}-${generateId()}`,
        product,
        quantity: 1,
        selectedVariant: variant,
        selectedModifiers: modifiers || [],
        subtotal: unitPrice,
      };
      
      const updatedBill = {
        ...activeBill,
        items: [...activeBill.items, newCartItem],
      };
      
      const newBills = [...bills];
      newBills[activeBillIndex] = updatedBill;
      
      return { bills: newBills };
    }),
    
    removeCartItem: (cartItemId) => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const activeBill = bills[activeBillIndex];
      const updatedBill = {
        ...activeBill,
        items: activeBill.items.filter(item => item.id !== cartItemId),
      };
      
      const newBills = [...bills];
      newBills[activeBillIndex] = updatedBill;
      
      return { bills: newBills };
    }),
    
    updateCartItemQuantity: (cartItemId, quantity) => set((state) => {
      if (quantity < 1) return state;
      
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const activeBill = bills[activeBillIndex];
      const updatedItems = activeBill.items.map(item => {
        if (item.id === cartItemId) {
          const modifiersTotal = item.selectedModifiers.reduce((sum, mod) => sum + mod.priceAdjustment, 0);
          const variantTotal = item.selectedVariant?.priceAdjustment || 0;
          const unitPrice = item.product.price + modifiersTotal + variantTotal;
          return {
            ...item,
            quantity,
            subtotal: unitPrice * quantity,
          };
        }
        return item;
      });
      
      const updatedBill = {
        ...activeBill,
        items: updatedItems,
      };
      
      const newBills = [...bills];
      newBills[activeBillIndex] = updatedBill;
      
      return { bills: newBills };
    }),
    
    clearCart: () => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const newBills = [...bills];
      newBills[activeBillIndex] = { ...newBills[activeBillIndex], items: [] };
      return { bills: newBills };
    }),
    
    setOrderType: (type) => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const newBills = [...bills];
      newBills[activeBillIndex] = { ...newBills[activeBillIndex], orderType: type };
      return { bills: newBills };
    }),
    
    setPaymentMethod: (method) => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const newBills = [...bills];
      newBills[activeBillIndex] = { ...newBills[activeBillIndex], paymentMethod: method };
      return { bills: newBills };
    }),
    
    setCustomerDetails: (customer) => set((state) => {
      const { bills, activeBillId } = state;
      const activeBillIndex = bills.findIndex(b => b.id === activeBillId);
      if (activeBillIndex === -1) return state;
      
      const newBills = [...bills];
      newBills[activeBillIndex] = { ...newBills[activeBillIndex], customer };
      return { bills: newBills };
    }),
  };
});
