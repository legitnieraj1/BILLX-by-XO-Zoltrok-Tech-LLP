"use client";

import { useEffect, useState } from "react";

export default function AnalyticsDashboard() {
  const [timeframe, setTimeframe] = useState('Today');
  const [data, setData] = useState({
    kpis: { totalRevenue: 84230, totalOrders: 1142, avgOrderValue: 73.50, netSales: 79110 },
    paymentSplit: { upi: 42, card: 23, cash: 35 },
    digitalPercentage: 65,
    topItems: [
        { name: "Artisanal Espresso Blend", sku: "ART-001", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBLhpNYw4cVZp0HdVaso_8lKUHUeYc26ZkDeMIeS5as2Sd79Dx00KmjpvaoLOBXRxe8nK7VvNfeOrhW7rjYp2BKeVFqPU3GmnKIjPCyndb4ignjFsTHLt4E9mFemc3QxEXAUHzZSbKio1_Z6OZ5H4uCOYAUGbpC_xbXkeKkPIsagc7hw4VdHK2loS4gBarQmrR7BBUlj2NupZzapSMhqSsaBnX8HqStoJDrvJgp7zGmObilHDFe7YxJ3nh3jqmKBpIBTKRLlockR9w", quantity: 342, revenue: 14200 },
        { name: "Matcha Zen Special", sku: "MAT-082", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBmnnJB5j971X_OpADKHFItsmwgUL0TsR6vwxZ1mt_NkzoUtA_w6ANut0cU0oglnpKlSumjC0YySfaV8fywr9w3t5dNLDUvktwgDPaRovYXdcVozK9Wg7daIsB7zEOPeuUVX9VSUI-6dvxsoC_yA4bgNAtJaExCDZFPlUdPFgZ2vsjuPe8YLbr06DsxvjsN-WZpWi4etcimuuysLqMFxgs3xYr93UuZNAas1S2iTVadFpVT4D83kD9Z3xKIoG6hiHEYCEpL_UkdOmg", quantity: 210, revenue: 9850 },
        { name: "Buttery Croissant", sku: "BAK-011", image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBx0kIrugKxFoTW_KsdEb-knFC3p6dlFQerMmoHcZ1GDs8GIQmMQVENcDmKidcvOSnpessGnR7vYYzKhILsMUYYSJg3xZK8X0vEBTjdi_hPDqS1uPFu7Q1K8x1KtSWjimVSqRy05L3LnxDSf_74fBiYovBiSYfvlg1_A1eAEV6vcavSrJF8KZAWynhaHCA7PeHPzHiqsTmHevQ8BMQ8Xcu4yHwLFiSrmUGiVpT6BQLarCpw2FsO_XM5Omt3YuM3e_uOr_sgAnMJnkk", quantity: 188, revenue: 7420 }
    ],
    inventoryInsights: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rangeMap: Record<string, string> = { 'Today': 'today', 'Week': 'week', 'Month': 'month', 'Custom': 'today' };
    import('@/lib/api').then(({ fetchAnalyticsSummary }) => {
      fetchAnalyticsSummary(rangeMap[timeframe] || 'today')
        .then(json => {
          if (json.success) {
            setData((prev: any) => ({
              ...prev,
              kpis: {
                ...prev.kpis,
                totalRevenue: json.data?.totalRevenue || 0,
                totalOrders: json.data?.orderCount || 0,
                avgOrderValue: json.data?.averageOrderValue || 0,
              }
            }));
          }
          setLoading(false);
        })
        .catch(console.error);
    });
  }, [timeframe]);

  if (loading) return null;

  return (
    <div className="h-full overflow-y-auto no-scrollbar pb-12 bg-surface">
      <header className="flex justify-between items-center px-8 py-6 mb-2">
        <div className="flex items-center gap-8">
          <h2 className="text-2xl font-black tracking-tighter text-[#022448]">Performance</h2>
          <div className="flex items-center bg-surface-container-high rounded-full p-1 h-10">
            {['Today', 'Week', 'Month', 'Custom'].map(tf => (
              <button 
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                  timeframe === tf ? 'bg-white shadow-sm text-primary font-bold' : 'font-medium text-slate-500 hover:text-primary'
                }`}
              >
                {tf} {tf === 'Custom' && <span className="material-symbols-outlined text-sm">calendar_today</span>}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => window.print()} className="bg-gradient-to-br from-secondary-container to-secondary text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-secondary/20">
          <span className="material-symbols-outlined text-sm">download</span>
          Download Report (PDF)
        </button>
      </header>

      <div className="px-8 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span> 12.5%
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Total Revenue</p>
            <h3 className="text-3xl font-black text-primary">₹{data.kpis.totalRevenue.toFixed(2)}</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">shopping_bag</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span> 8.2%
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Total Orders</p>
            <h3 className="text-3xl font-black text-primary">{data.kpis.totalOrders}</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">request_quote</span>
              </div>
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-md flex items-center">
                <span className="material-symbols-outlined text-xs mr-0.5">trending_down</span> 2.1%
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Avg Order Value</p>
            <h3 className="text-3xl font-black text-primary">₹{data.kpis.avgOrderValue.toFixed(2)}</h3>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-xl border border-transparent hover:border-outline-variant/20 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/5 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">account_balance_wallet</span>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md flex items-center">
                <span className="material-symbols-outlined text-xs mr-0.5">trending_up</span> 14.8%
              </span>
            </div>
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Net Sales</p>
            <h3 className="text-3xl font-black text-primary">₹{data.kpis.netSales.toFixed(2)}</h3>
          </div>
        </div>

        {/* Main Revenue Chart */}
        <section className="bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-outline-variant/10">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h4 className="text-lg font-bold text-primary">Revenue Performance</h4>
              <p className="text-sm text-slate-500">Snapshot of business growth over time</p>
            </div>
            <div className="flex bg-surface-container p-1 rounded-lg">
              <button className="px-4 py-1.5 text-xs font-bold rounded-md bg-white shadow-sm text-primary">Revenue</button>
              <button className="px-4 py-1.5 text-xs font-medium text-slate-500 hover:text-primary transition-colors">Orders</button>
            </div>
          </div>
          <div className="relative h-64 w-full">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 250">
              <line stroke="#eceef0" strokeWidth="1" x1="0" x2="1000" y1="200" y2="200" />
              <line stroke="#eceef0" strokeWidth="1" x1="0" x2="1000" y1="150" y2="150" />
              <line stroke="#eceef0" strokeWidth="1" x1="0" x2="1000" y1="100" y2="100" />
              <line stroke="#eceef0" strokeWidth="1" x1="0" x2="1000" y1="50" y2="50" />
              <path d="M0,180 C150,160 250,220 400,100 C550,0 750,150 1000,80 L1000,200 L0,200 Z" fill="url(#gradientRevenue)" opacity="0.1" />
              <path d="M0,180 C150,160 250,220 400,100 C550,0 750,150 1000,80" fill="none" stroke="#022448" strokeLinecap="round" strokeWidth="4" />
              <defs>
                <linearGradient id="gradientRevenue" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#022448" />
                  <stop offset="100%" stopColor="#ffffff" />
                </linearGradient>
              </defs>
              <circle cx="400" cy="100" fill="#fd761a" r="6" stroke="white" strokeWidth="2" />
            </svg>
            <div className="flex justify-between mt-6 px-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>08:00</span><span>10:00</span><span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span><span>20:00</span><span>22:00</span>
            </div>
          </div>
        </section>

        {/* Top Selling & Fast/Slow Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Selling Items */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-bold text-primary">Top Selling Items</h4>
              <button className="text-xs font-bold text-secondary-container hover:underline">View All</button>
            </div>
            <div className="space-y-6">
              {data.topItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-surface-container flex-shrink-0">
                    <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-primary truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">₹{item.revenue.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{item.quantity} sold</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
            <h4 className="text-lg font-bold text-primary mb-8">Payment Methods</h4>
            <div className="relative flex justify-center items-center mb-8">
              {/* Semi Circle */}
              <div className="w-40 h-40 rounded-full border-[12px] border-primary-container relative">
                <div className="absolute inset-0 flex flex-col items-center justify-center pb-2">
                  <span className="text-2xl font-black text-primary">{data.digitalPercentage}%</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Digital</span>
                </div>
              </div>
            </div>
            <div className="space-y-3 px-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <span className="text-sm font-medium text-slate-600">UPI Payments</span>
                </div>
                <span className="text-sm font-bold text-primary">{data.paymentSplit.upi}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-secondary-container"></div>
                  <span className="text-sm font-medium text-slate-600">Card</span>
                </div>
                <span className="text-sm font-bold text-primary">{data.paymentSplit.card}%</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-surface-container-highest"></div>
                  <span className="text-sm font-medium text-slate-600">Cash</span>
                </div>
                <span className="text-sm font-bold text-primary">{data.paymentSplit.cash}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Insights */}
        {data.inventoryInsights && data.inventoryInsights.length > 0 && (
          <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-sm border border-outline-variant/10">
            <div className="flex justify-between items-center mb-8">
              <h4 className="text-lg font-bold text-primary">Inventory Insights</h4>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-bold rounded-full border border-rose-100">{data.inventoryInsights.length} Low Stock</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] uppercase font-black text-slate-400 tracking-widest border-b border-surface-container">
                    <th className="pb-4 font-black">Item Name</th>
                    <th className="pb-4 font-black">Category</th>
                    <th className="pb-4 font-black">Stock Status</th>
                    <th className="pb-4 font-black text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-container">
                  {data.inventoryInsights.map((item: any, idx) => (
                    <tr key={idx}>
                      <td className="py-4">
                        <p className="text-sm font-bold text-primary">{item.name}</p>
                        <p className="text-[10px] text-slate-400">SKU: {item.sku}</p>
                      </td>
                      <td className="py-4 text-sm font-medium text-slate-600">{item.category}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-rose-600">Only {item.stock} left!</span>
                        </div>
                      </td>
                      <td className="py-4 text-right">
                        <button className="text-[10px] font-bold text-primary border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-all">Reorder</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
