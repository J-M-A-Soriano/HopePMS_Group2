import React, { useEffect, useState } from 'react';
import { Package, Search, Plus, Minus, Layers } from 'lucide-react';
import { fetchProducts, Product } from '@/lib/api/products';
import { performInventoryTransaction } from '@/lib/api/inventory';
import { useAuth } from '@/context/AuthContext';

export function Inventory() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transactionType, setTransactionType] = useState<'STOCK_IN' | 'STOCK_OUT'>('STOCK_IN');
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !user) return;
    setSubmitting(true);
    
    try {
      await performInventoryTransaction(
        selectedProduct.prodCode,
        transactionType,
        parseFloat(quantity),
        user.id,
        notes
      );
      
      // Update local state instantly
      setProducts(products.map(p => {
        if (p.prodCode === selectedProduct.prodCode) {
           const change = transactionType === 'STOCK_IN' ? parseFloat(quantity) : -parseFloat(quantity);
           return { ...p, stock_quantity: (p.stock_quantity || 0) + change };
        }
        return p;
      }));
      
      setShowModal(false);
    } catch (err) {
      console.error('Failed transaction:', err);
      alert('Transaction failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openModal = (product: Product, type: 'STOCK_IN' | 'STOCK_OUT') => {
    setSelectedProduct(product);
    setTransactionType(type);
    setQuantity('');
    setNotes('');
    setShowModal(true);
  };

  const filteredProducts = products.filter(p => 
    p.prodCode.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.description || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-emerald-500" /> Inventory Management
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Track and adjust real-time stock levels.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search inventory..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full sm:w-64 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm text-slate-900 dark:text-white"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading inventory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border/50 dark:border-slate-700">
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Code</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm">Product Name</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm text-right">In Stock</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm text-center">Unit</th>
                  <th className="p-4 font-semibold text-slate-700 dark:text-slate-300 text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50 dark:divide-slate-700">
                 {filteredProducts.map(p => (
                   <tr key={p.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="p-4 text-sm font-medium text-slate-900 dark:text-white">
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{p.prodCode}</span>
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400">{p.description}</td>
                      <td className="p-4 text-sm text-right">
                         <span className={`font-bold px-2 py-1 rounded text-xs ${
                           (p.stock_quantity || 0) <= 0 
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' 
                            : (p.stock_quantity || 0) < 10 
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                              : 'text-slate-800 dark:text-white'
                         }`}>
                           {p.stock_quantity || 0}
                         </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center uppercase text-xs">{p.unit}</td>
                      <td className="p-4 text-right">
                         <div className="flex justify-end gap-2">
                           <button onClick={() => openModal(p, 'STOCK_IN')} className="p-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 rounded transition" title="Add Stock">
                             <Plus className="w-4 h-4" />
                           </button>
                           <button onClick={() => openModal(p, 'STOCK_OUT')} className="p-1.5 bg-rose-100 text-rose-700 hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-400 rounded transition" title="Remove Stock">
                             <Minus className="w-4 h-4" />
                           </button>
                         </div>
                      </td>
                   </tr>
                 ))}
                 {filteredProducts.length === 0 && (
                   <tr>
                     <td colSpan={5} className="p-8 text-center text-slate-500">No products found.</td>
                   </tr>
                 )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`p-4 border-b dark:border-slate-700 ${transactionType === 'STOCK_IN' ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-rose-50 dark:bg-rose-900/20'}`}>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {transactionType === 'STOCK_IN' ? <Plus className="w-5 h-5 text-emerald-500" /> : <Minus className="w-5 h-5 text-rose-500" />}
                {transactionType === 'STOCK_IN' ? 'Stock In' : 'Stock Out'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">{selectedProduct.description} ({selectedProduct.prodCode})</p>
            </div>
            <form onSubmit={handleTransaction} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantity</label>
                  <input required type="number" min="1" step="0.01" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes / Reason</label>
                  <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full rounded-md border border-slate-300 dark:border-slate-600 bg-transparent px-3 py-2 text-sm text-slate-900 dark:text-white" rows={2}></textarea>
               </div>
               <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">Cancel</button>
                  <button disabled={submitting} type="submit" className={`px-4 py-2 text-sm font-medium text-white rounded-md transition ${transactionType === 'STOCK_IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    {submitting ? 'Saving...' : 'Confirm'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
