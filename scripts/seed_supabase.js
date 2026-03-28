const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Manually parse the .env.local file so we don't have to install dotenv globally
const envPath = path.join(__dirname, '../.env.local');
let envs = {};
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let val = match[2] || '';
      // Remove surrounding quotes if present
      if (val.startsWith('"') && val.endsWith('"')) { val = val.slice(1, -1); }
      envs[key] = val;
    }
  });
}

const supabaseUrl = envs.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envs.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const jsonPath = path.join(__dirname, '../cup_culture_inventory.json');
  console.log(`Reading inventory from ${jsonPath}...`);
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const data = JSON.parse(rawData);

  // 1. Create a default business
  const businessId = '00000000-0000-0000-0000-000000000001';
  console.log('Inserting/Upserting Business...');
  
  // We use simple select and insert to mimic upsert safely since we might not have unique constraints other than id
  const { data: existingBiz } = await supabase.from('businesses').select('id').eq('id', businessId).single();
  
  if (!existingBiz) {
    const { error: bizErr } = await supabase.from('businesses').insert({
      id: businessId,
      name: 'Cup Culture',
      ownerName: 'Admin',
      email: 'admin@cupculture.com',
      phone: '+91-9000000000'
    });
    if (bizErr) {
      console.error('Failed to insert business:', bizErr);
      return;
    }
  }

  // 2. Insert Categories and Products
  console.log('Inserting Menu Items...');
  
  for (const cat of data.categories) {
    console.log(`Processing Category: ${cat.name}`);
    
    // Check if category exists
    const { data: existingCat } = await supabase.from('categories').select('id').eq('id', cat.id).single();
    if (!existingCat) {
      const { error: catErr } = await supabase.from('categories').insert({
        id: cat.id,
        businessId: businessId,
        name: cat.name,
      });
      if (catErr) console.error("Error inserting category:", catErr);
    }

    // Insert Products for this category
    for (const item of cat.items) {
      const { data: existingProd } = await supabase.from('products').select('id').eq('id', item.id).single();
      if (!existingProd) {
        const { error: prodErr } = await supabase.from('products').insert({
          id: item.id,
          businessId: businessId,
          categoryId: cat.id,
          name: item.name,
          price: item.price,
          costPrice: item.cost_price,
          stock: item.stock,
          lowStockAlert: item.low_stock_alert,
          unit: item.unit,
          isAvailable: item.is_available,
          type: item.type,
          tags: item.tags || [],
          primaryImageUrl: item.image,
        });
        if (prodErr) console.error(`Error inserting product ${item.name}:`, prodErr);
      }
    }
  }

  console.log('Supabase Database successfully seeded with Cup Culture inventory!');
}

seed().catch(err => {
  console.error("Critical Runtime Error:", err);
  process.exit(1);
});
