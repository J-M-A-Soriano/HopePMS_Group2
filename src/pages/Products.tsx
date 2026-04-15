import React, { useEffect, useState } from 'react';
import { PackagePlus, Edit, Trash2, X } from 'lucide-react';
import { fetchProducts, softDeleteProduct, addProduct, updateProduct } from '@/lib/api/products';
import type { Product } from '@/lib/api/products';
import { useUserRights } from '@/context/UserRightsContext';
import { useAuth } from '@/context/AuthContext';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { canEditProduct, canDeleteProduct } = useUserRights();
  const { user, staffId } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ prodCode: '', description: '', unit: 'ea', initialPrice: '0', oldPrice: 0 });

  const loadProducts = async () => {
    let timeoutId: number;
    try {
      setLoading(true);
      timeoutId = window.setTimeout(() => setLoading(false), 5000);
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      clearTimeout(timeoutId!);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (prodCode: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await softDeleteProduct(prodCode);
      await loadProducts();
    } catch (e) {
      console.error(e);
      alert('Error deleting product');
    }
  };

  const handleOpenAdd = () => {
    setFormData({ prodCode: '', description: '', unit: 'ea', initialPrice: '0', oldPrice: 0 });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({ 
       prodCode: p.prodCode, 
       description: p.description, 
       unit: p.unit, 
       initialPrice: (p.unitPrice || 0).toString(),
       oldPrice: p.unitPrice || 0 // cache the old price defensively!
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPrice = parseFloat(formData.initialPrice) || 0;
      if (isEditing) {
        await updateProduct(
          formData.prodCode, 
          formData.description, 
          formData.unit, 
          parsedPrice,
          formData.oldPrice || 0, // transmit old price
          staffId || '', 
          user?.id || ''
        );
      } else {
        await addProduct(
          { prodCode: formData.prodCode, description: formData.description, unit: formData.unit }, 
          parsedPrice
        );
      }
      setShowModal(false);
      await loadProducts();
    } catch (err: any) {
      alert("Error saving: " + err.message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading products...</div>;
  }

  return (
    <div className="p-8 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Products</h1>
          <p className="text-slate-500">Manage your product inventory and descriptions.</p>
        </div>
        {canEditProduct && (
          <button onClick={handleOpenAdd} className="bg-primary text-white px-4 py-2 rounded-md font-medium hover:bg-primary/90 flex items-center gap-2 transition-colors">
            <PackagePlus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-600">Product Code</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Description</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Unit</th>
              <th className="px-6 py-4 font-semibold text-slate-600">Current Price</th>
              {(canEditProduct || canDeleteProduct) && <th className="px-6 py-4 font-semibold text-slate-600 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No active products found.</td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.prodCode} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{p.prodCode}</td>
                  <td className="px-6 py-4 text-slate-600">{p.description}</td>
                  <td className="px-6 py-4 text-slate-600">
                    <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-700 text-xs font-medium uppercase">
                      {p.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-emerald-600">${p.unitPrice?.toFixed(2)}</td>
                  {(canEditProduct || canDeleteProduct) && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {canEditProduct && (
                          <button onClick={() => handleOpenEdit(p)} className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {canDeleteProduct && (
                          <button 
                            onClick={() => handleDelete(p.prodCode)}
                            className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded transition-colors" title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-lg shadow-xl border w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center p-4 border-b">
                 <h2 className="text-lg font-bold text-slate-800">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                 <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-4 space-y-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Product Code</label>
                    <input 
                      required 
                      disabled={isEditing}
                      type="text" 
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-primary/20 focus:border-primary outline-none disabled:bg-slate-100" 
                      value={formData.prodCode} 
                      onChange={e => setFormData({...formData, prodCode: e.target.value.toUpperCase()})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <input 
                      required 
                      type="text" 
                      className="w-full border rounded px-3 py-2 text-sm focus:ring-primary/20 focus:border-primary outline-none" 
                      value={formData.description} 
                      onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Unit Type</label>
                        <input 
                          required 
                          type="text" 
                          placeholder="ea, box, pc"
                          className="w-full border rounded px-3 py-2 text-sm focus:ring-primary/20 focus:border-primary outline-none" 
                          value={formData.unit} 
                          onChange={e => setFormData({...formData, unit: e.target.value.toLowerCase()})}
                        />
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                           {isEditing ? 'Current Active Price' : 'Initial Price'}
                        </label>
                        <input 
                          required 
                          type="number" 
                          step="0.01"
                          min="0"
                          className="w-full border rounded px-3 py-2 text-sm focus:ring-primary/20 focus:border-primary outline-none" 
                          value={formData.initialPrice} 
                          onChange={e => setFormData({...formData, initialPrice: e.target.value})}
                        />
                     </div>
                 </div>
                 <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border rounded text-sm text-slate-600 hover:bg-slate-50 font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-primary text-white rounded text-sm font-medium hover:bg-primary/90 transition-colors">
                      {isEditing ? 'Save Changes' : 'Create Product Baseline'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
}
