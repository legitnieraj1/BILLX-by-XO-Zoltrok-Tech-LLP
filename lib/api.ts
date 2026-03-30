import { db } from './db';
import { syncEngine } from './syncEngine';

/**
 * PWA Offline-First API Client Wrapper
 * Bypasses the network for POS operations, relying on Dexie IndexDB cache.
 * Falls back to Network for Analytics.
 */

const BUSINESS_ID = process.env.NEXT_PUBLIC_BUSINESS_ID || '00000000-0000-0000-0000-000000000001';

// ─── Products ───────────────────────────────────────────────────────

export async function fetchProducts() {
  const products = await db.products.where('businessId').equals(BUSINESS_ID).toArray();
  // Trigger a background pull to refresh cache if online
  syncEngine.pullData(BUSINESS_ID).catch(console.error);
  return { success: true, data: products, total: products.length };
}

export async function updateProduct(productId: string, data: any) {
  try {
    await db.products.update(productId, data);
    if (navigator.onLine) {
      const { supabase } = await import('./supabase');
      const { error } = await supabase.from('products').update(data).eq('id', productId);
      if (error) throw error;
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update product:", error);
    throw new Error(error.message);
  }
}

export async function addProduct(data: {
  name: string;
  price: number;
  categoryId: string;
  isAvailable: boolean;
  primaryImageUrl?: string;
  businessId?: string;
}) {
  const newId = crypto.randomUUID();
  const product = {
    id: newId,
    businessId: BUSINESS_ID,
    stock: 0,
    ...data,
  };
  try {
    await db.products.put(product);
    if (navigator.onLine) {
      const { supabase } = await import('./supabase');
      const { error } = await supabase.from('products').insert(product);
      if (error) throw error;
    }
    return { success: true, data: product };
  } catch (error: any) {
    console.error("Failed to add product:", error);
    throw new Error(error.message);
  }
}

export async function deleteProduct(productId: string) {
  try {
    await db.products.delete(productId);
    if (navigator.onLine) {
      const { supabase } = await import('./supabase');
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) throw error;
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete product:", error);
    throw new Error(error.message);
  }
}

export async function fetchCategories() {
  const categoriesDb = await db.categories.where('businessId').equals(BUSINESS_ID).toArray();
  // If no DB categories yet because it takes some time to sync initially
  const mapped = categoriesDb.length > 0 
    ? categoriesDb.map(c => c.name) 
    : ['Coffee', 'Tea', 'Snacks', 'Desserts', 'Combos']; 
  return { success: true, data: mapped };
}

// ─── Orders ─────────────────────────────────────────────────────────

export async function createOrder(orderData: any) {
  try {
    const clientOrderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const offlineOrder = {
      clientOrderId,
      businessId: BUSINESS_ID,
      sync_status: 'pending' as const,
      ...orderData
    };
    
    // Save locally
    await db.orders.put(offlineOrder);
    
    // Try to sync in background
    syncEngine.pushPendingOrders().catch(console.error);

    return { success: true, data: offlineOrder };
  } catch (err: any) {
    throw new Error(err.message || "Failed to create order locally");
  }
}

export async function fetchOrders(page = 1, limit = 50) {
  // Fetch from Dexie
  const orders = await db.orders.orderBy('createdAt').reverse().limit(limit).toArray();
  return { success: true, data: orders, pagination: { page, limit, total: orders.length } };
}

export async function fetchAnalyticsSummary(range = 'today') {
  if (!navigator.onLine) {
    return { success: false, data: { error: 'Offline', totalRevenue: 0, orderCount: 0 } };
  }
  
    try {
      const { supabase } = await import('./supabase');
      let query = supabase
        .from('orders')
        .select('subtotal, total, items', { count: 'exact' })
        .eq('businessId', BUSINESS_ID)
        .eq('status', 'completed');

    if (range === 'today') {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      query = query.gte('createdAt', startOfDay.toISOString());
    } else if (range === 'week') {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      query = query.gte('createdAt', startOfWeek.toISOString());
    } else if (range === 'month') {
      const startOfMonth = new Date();
      startOfMonth.setMonth(startOfMonth.getMonth() - 1);
      query = query.gte('createdAt', startOfMonth.toISOString());
    } else if (range.startsWith('custom:')) {
      const [startStr, endStr] = range.split(':')[1].split(',');
      const startDate = new Date(startStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endStr);
      endDate.setHours(23, 59, 59, 999);
      query = query.gte('createdAt', startDate.toISOString()).lte('createdAt', endDate.toISOString());
    }

    const { data: orders, count, error } = await query;
    if (error) throw error;

    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
    
    // Aggregating Top Items
    const itemMap = new Map<string, any>();
    orders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          const key = item.productId || item.productName;
          if (!key) return;
          const existing = itemMap.get(key) || { 
            productId: item.productId, 
            name: item.productName || 'Unknown Item', 
            quantity: 0, 
            revenue: 0 
          };
          existing.quantity += Number(item.quantity) || 0;
          existing.revenue += Number(item.price) || 0;
          itemMap.set(key, existing);
        });
      }
    });

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3);

    if (topItems.length > 0) {
      try {
        const prodData = await supabase
          .from('products')
          .select('id, sku, primaryImageUrl')
          .in('id', topItems.map(t => t.productId).filter(Boolean));
        if (prodData.data) {
          const pMap = new Map(prodData.data.map(p => [p.id, p]));
          topItems.forEach(t => {
            if (t.productId && pMap.has(t.productId)) {
              const p = pMap.get(t.productId);
              if (p) {
                t.image = p.primaryImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80";
                t.sku = p.sku || "N/A";
              }
            } else {
              t.image = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80";
              t.sku = t.sku || "N/A";
            }
          });
        }
      } catch(e) { console.warn("Could not fetch product details"); }
    }

    return {
      success: true,
      data: {
        totalRevenue: totalRevenue,
        orderCount: count,
        averageOrderValue: count && count > 0 ? totalRevenue / count : 0,
        topItems
      }
    };
  } catch (error: any) {
    console.error('Analytics Fetch Error:', error);
    return { success: false, data: { totalRevenue: 0, orderCount: 0, topItems: [] } };
  }
}

export async function fetchRevenueTrend(range = 'today') {
  if (!navigator.onLine) {
    return { success: false, data: [] };
  }
  // Optional implementation if dashboard uses this
  return { success: true, data: [] };
}
