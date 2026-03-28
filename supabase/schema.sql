-- Supabase SQL Schema for BillX PWA

-- 1. Create Business table
CREATE TABLE public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "ownerName" TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    "isActive" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 2. Create Category table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    "displayOrder" INTEGER DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 3. Create Product table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    "categoryId" UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    "costPrice" NUMERIC(10, 2),
    stock INTEGER DEFAULT 0,
    "lowStockAlert" INTEGER DEFAULT 10,
    unit TEXT DEFAULT 'pcs',
    "isAvailable" BOOLEAN DEFAULT true,
    type TEXT,
    tags TEXT[] DEFAULT '{}',
    "primaryImageUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 4. Create Order table
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "businessId" UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    "clientOrderId" TEXT UNIQUE, -- For offline sync deduplication
    "orderNumber" TEXT NOT NULL,
    "orderType" TEXT DEFAULT 'dine-in',
    "customerName" TEXT DEFAULT '',
    "customerPhone" TEXT DEFAULT '',
    subtotal NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) NOT NULL,
    "paymentMethod" TEXT DEFAULT 'cash',
    status TEXT DEFAULT 'completed',
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- 5. Create OrderItem table
CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "orderId" UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    "productId" UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    "productName" TEXT DEFAULT '',
    quantity INTEGER DEFAULT 1,
    "unitPrice" NUMERIC(10, 2) DEFAULT 0,
    price NUMERIC(10, 2) NOT NULL
);

-- Optional: Enable RLS (Row Level Security) if you want strict access rules.
-- Since this is an MVP PWA without heavy auth yet, we can skip RLS or make it permissive for demo.
-- ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow public all" ON public.businesses FOR ALL USING (true);
-- ... same for other tables.

-- Create some indexes to match former Prisma indexes
CREATE INDEX idx_categories_business ON public.categories("businessId");
CREATE INDEX idx_products_business ON public.products("businessId");
CREATE INDEX idx_products_category ON public.products("businessId", "categoryId");
CREATE INDEX idx_orders_business ON public.orders("businessId");
CREATE INDEX idx_orders_clientid ON public.orders("clientOrderId");
CREATE INDEX idx_orderitems_order ON public.order_items("orderId");
