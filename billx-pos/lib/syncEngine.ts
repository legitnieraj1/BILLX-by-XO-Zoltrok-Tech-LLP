import { db } from "./db";
import { supabase } from "./supabase";

export const syncEngine = {
  /**
   * PULL functionality: Get categories and products from Supabase and store in IndexedDB
   * We execute this when the app loads and is online
   */
  async pullData(businessId: string) {
    if (!navigator.onLine) {
      console.log("Offline: Cannot pull data from server.");
      return;
    }

    try {
      console.log("Pulling Menu Data from Supabase...");
      
      // Fetch Categories
      const { data: categories, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .eq('businessId', businessId);

      if (catErr) throw catErr;

      // Fetch Products
      const { data: products, error: prodErr } = await supabase
        .from('products')
        .select('*')
        .eq('businessId', businessId);

      if (prodErr) throw prodErr;

      // Clear existing and replace (or deep merge if needed)
      // For this system, we'll replace the local cache completely.
      await db.transaction('rw', db.categories, db.products, async () => {
        await db.categories.clear();
        await db.products.clear();
        
        if (categories && categories.length > 0) {
          await db.categories.bulkAdd(categories as any[]);
        }
        
        if (products && products.length > 0) {
          await db.products.bulkAdd(products as any[]);
        }
      });
      console.log("Menu Data pulled and cached successfully");
    } catch (error) {
      console.error("Error pulling data from Supabase", error);
    }
  },

  /**
   * PUSH functionality: Find offline orders stored locally and sync them to Supabase
   */
  async pushPendingOrders() {
    if (!navigator.onLine) {
      console.log("Offline: Cannot push pending orders.");
      return;
    }

    try {
      // Find orders marked as pending
      const pendingOrders = await db.orders.where('sync_status').equals('pending').toArray();

      if (pendingOrders.length === 0) {
        return;
      }

      console.log(`Pushing ${pendingOrders.length} pending orders to Supabase...`);

      for (const order of pendingOrders) {
        // Prepare the root Order object
        const orderData = {
          clientOrderId: order.clientOrderId,
          businessId: order.businessId,
          orderNumber: order.orderNumber,
          orderType: order.orderType,
          customerName: order.customerName,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          paymentMethod: order.paymentMethod,
          status: order.status,
          createdAt: order.createdAt
        };

        // UPSERT the order into Supabase (handle idempotency with clientOrderId)
        const { data: insertedOrder, error: orderErr } = await supabase
          .from('orders')
          .upsert(orderData, { onConflict: 'clientOrderId' })
          .select()
          .single();

        if (orderErr) {
          console.error(`Failed to sync order ${order.clientOrderId}:`, orderErr);
          continue; // skip marking as synced if it failed
        }

        const supabaseOrderId = insertedOrder.id;

        // INSERT items for this order
        const orderItems = order.items.map(item => ({
          orderId: supabaseOrderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.price
        }));

        const { error: itemsErr } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsErr) {
          console.error(`Failed to sync items for order ${order.clientOrderId}:`, itemsErr);
          // Note: for production a more robust rollback or item-checking might be needed,
          // but marking pending is usually safer so it retries.
          continue; 
        }

        // Mark as synced locally
        await db.orders.update(order.clientOrderId, { sync_status: 'synced' });
        console.log(`Order ${order.clientOrderId} fully synced!`);
      }

    } catch (error) {
      console.error("Error pushing pending orders:", error);
    }
  }
};
