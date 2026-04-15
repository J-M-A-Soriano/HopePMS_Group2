import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BarChart3 } from 'lucide-react';

export function Reports() {
  const [topSellers, setTopSellers] = useState<{ prodCode: string, total_qty: number, description?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTopSellers = async () => {
    setLoading(true);
    try {
      // In a real app we'd call an RPC or a database view.
      // We will perform a basic local grouping for demonstration over the salesDetail table.
      const { data: salesData, error: salesError } = await supabase.from('salesDetail').select('prodCode, quantity');
      const { data: productData } = await supabase.from('product').select('prodCode, description');

      if (!salesError && salesData) {
        const aggregated: Record<string, number> = {};
        for (const sale of salesData as any[]) {
          const code = sale.prodCode || sale.prodcode;
          aggregated[code] = (aggregated[code] || 0) + Number(sale.quantity);
        }

        const productMap: Record<string, string> = {};
        if (productData) {
          for (const p of productData as any[]) {
             const code = p.prodCode || p.prodcode;
             productMap[code] = p.description;
          }
        }

        const sorted = Object.entries(aggregated)
          .map(([prodCode, total_qty]) => ({ prodCode, total_qty, description: productMap[prodCode] || 'Unknown' }))
          .sort((a, b) => b.total_qty - a.total_qty)
          .slice(0, 10); // Top 10
        
        setTopSellers(sorted);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTopSellers();
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" /> Reports
          </h1>
          <p className="text-slate-500">View analytics and top-selling products.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-800">Top 10 Selling Products</h2>
          {loading ? (
             <div className="text-slate-500">Loading Report...</div>
          ) : (
            <div className="space-y-4">
              {topSellers.map((item, idx) => (
                <div key={item.prodCode} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-100 text-slate-600 font-bold w-6 h-6 flex items-center justify-center rounded-full text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{item.description}</p>
                      <p className="text-xs text-slate-500">{item.prodCode}</p>
                    </div>
                  </div>
                  <div className="font-semibold text-primary">
                    {item.total_qty} units
                  </div>
                </div>
              ))}
              {topSellers.length === 0 && <p className="text-slate-500">No sales data available.</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
