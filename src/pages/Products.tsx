import React, { useEffect, useState, useMemo } from 'react';
import { PackagePlus, Edit, Trash2, X, AlertCircle, CheckCircle, Search, Filter, Download, ArrowUpDown, ArrowUp, ArrowDown, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { fetchProducts, softDeleteProduct, addProduct, updateProduct } from '@/lib/api/products';
import type { Product } from '@/lib/api/products';
import { useUserRights } from '@/context/UserRightsContext';
import { useAuth } from '@/context/AuthContext';
import { ActionConfirmModal } from '@/components/ActionConfirmModal';

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { canEditProduct, canDeleteProduct } = useUserRights();
  const { user, staffId } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ 
    prodCode: '', description: '', unit: 'ea', initialPrice: '0', oldPrice: 0,
    category: 'Uncategorized', supplier: 'Unknown', sku: '', stock_quantity: '0', low_stock_threshold: '10'
  });
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  // Table State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [sortField, setSortField] = useState<keyof Product>('prodCode');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showFeedback = (message: string, type: 'error' | 'success' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Compute stats
  const totalValue = products.reduce((acc, p) => acc + ((p.unitPrice || 0) * (p.stock_quantity || 0)), 0);
  const lowStockCount = products.filter(p => (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0)).length;
  const categories = Array.from(new Set(products.map(p => p.category || 'Uncategorized'))).filter(Boolean);

  // Filter & Sort logic
  const filteredAndSorted = useMemo(() => {
    let result = products.filter(p => {
      const searchMatch = 
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.prodCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.supplier && p.supplier.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const categoryMatch = categoryFilter === 'ALL' || (p.category || 'Uncategorized') === categoryFilter;
      
      let stockMatch = true;
      if (stockFilter === 'LOW') stockMatch = (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0);
      if (stockFilter === 'OUT') stockMatch = (p.stock_quantity ?? 0) === 0;
      if (stockFilter === 'IN') stockMatch = (p.stock_quantity ?? 0) > (p.low_stock_threshold ?? 0);

      return searchMatch && categoryMatch && stockMatch;
    });

    result.sort((a, b) => {
      const aVal = a[sortField] ?? '';
      const bVal = b[sortField] ?? '';
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [products, searchTerm, categoryFilter, stockFilter, sortField, sortDir]);

  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedData = filteredAndSorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (field: keyof Product) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Product Code', 'Description', 'SKU', 'Category', 'Supplier', 'Unit', 'Price', 'Stock Quantity', 'Low Stock Alert'];
    const rows = filteredAndSorted.map(p => [
      p.prodCode,
      `"${p.description}"`,
      p.sku || '',
      p.category || 'Uncategorized',
      p.supplier || 'Unknown',
      p.unit,
      p.unitPrice || 0,
      p.stock_quantity || 0,
      p.low_stock_threshold || 10
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const triggerDelete = (prodCode: string) => {
    setProductToDelete(prodCode);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!productToDelete) return;
    try {
      await softDeleteProduct(productToDelete);
      await loadProducts();
      showFeedback('Product moved to archive.', 'success');
    } catch (e) {
      showFeedback('Error deleting product', 'error');
    }
    setDeleteModalOpen(false);
    setProductToDelete(null);
  };

  const handleOpenAdd = () => {
    setFormData({ 
      prodCode: '', description: '', unit: 'ea', initialPrice: '0', oldPrice: 0,
      category: 'Uncategorized', supplier: 'Unknown', sku: '', stock_quantity: '0', low_stock_threshold: '10'
    });
    setIsEditing(false);
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setFormData({ 
       prodCode: p.prodCode, 
       description: p.description, 
       unit: p.unit, 
       initialPrice: (p.unitPrice || 0).toString(),
       oldPrice: p.unitPrice || 0,
       category: p.category || 'Uncategorized',
       supplier: p.supplier || 'Unknown',
       sku: p.sku || '',
       stock_quantity: (p.stock_quantity || 0).toString(),
       low_stock_threshold: (p.low_stock_threshold || 10).toString()
    });
    setIsEditing(true);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedPrice = parseFloat(formData.initialPrice) || 0;
      const updates = {
        description: formData.description,
        unit: formData.unit,
        category: formData.category,
        supplier: formData.supplier,
        sku: formData.sku,
        stock_quantity: parseFloat(formData.stock_quantity) || 0,
        low_stock_threshold: parseFloat(formData.low_stock_threshold) || 10
      };

      if (isEditing) {
        await updateProduct(
          formData.prodCode, 
          updates, 
          parsedPrice,
          formData.oldPrice || 0,
          staffId || '', 
          user?.id || ''
        );
      } else {
        await addProduct(
          { prodCode: formData.prodCode, ...updates }, 
          parsedPrice
        );
      }
      setShowModal(false);
      showFeedback(isEditing ? 'Product successfully updated.' : 'New product successfully created.', 'success');
      await loadProducts();
    } catch (err: any) {
      showFeedback("Error saving: " + err.message, 'error');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading inventory data...</div>;
  }

  return (
    <div className="p-4 md:p-8 relative pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-500" /> Master Inventory
          </h1>
          <p className="text-slate-500 dark:text-slate-400">Enterprise product catalog and stock management.</p>
        </div>
        <div className="flex gap-2">
           <button onClick={handleExportCSV} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-4 py-2 rounded-md font-medium hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center gap-2 transition-colors border dark:border-slate-700 shadow-sm">
              <Download className="w-4 h-4" /> Export
           </button>
          {canEditProduct && (
            <button onClick={handleOpenAdd} className="bg-indigo-600 text-white px-4 py-2 rounded-md font-medium hover:bg-indigo-700 flex items-center gap-2 transition-colors shadow-sm">
              <PackagePlus className="w-5 h-5" />
              Add Product
            </button>
          )}
        </div>
      </div>

      {feedback && (
         <div className={`mb-6 p-4 rounded-md text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${feedback.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' : 'bg-emerald-50 border border-emerald-200 text-emerald-800'}`}>
            {feedback.type === 'error' ? <AlertCircle className="h-5 w-5 shrink-0" /> : <CheckCircle className="h-5 w-5 shrink-0" />}
            {feedback.message}
         </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Products</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{products.length}</h3>
               </div>
               <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg"><Package className="w-5 h-5 text-blue-600 dark:text-blue-400" /></div>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Inventory Valuation</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
               </div>
               <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg"><TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /></div>
            </div>
         </div>
         <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-5 shadow-sm">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Low Stock Alerts</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{lowStockCount}</h3>
               </div>
               <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg"><AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" /></div>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-lg border dark:border-slate-700 shadow-sm overflow-hidden transition-colors flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-4 border-b dark:border-slate-700 flex flex-col sm:flex-row gap-4 justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search code, description, SKU, supplier..."
              value={searchTerm}
              onChange={(e) => {setSearchTerm(e.target.value); setCurrentPage(1);}}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-white"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select 
              value={categoryFilter} 
              onChange={e => {setCategoryFilter(e.target.value); setCurrentPage(1);}}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Categories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select 
              value={stockFilter} 
              onChange={e => {setStockFilter(e.target.value); setCurrentPage(1);}}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-2 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="ALL">All Stock Status</option>
              <option value="IN">In Stock</option>
              <option value="LOW">Low Stock</option>
              <option value="OUT">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleSort('prodCode')}>
                  <div className="flex items-center gap-1">Code {sortField === 'prodCode' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleSort('description')}>
                  <div className="flex items-center gap-1">Description {sortField === 'description' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300">Category</th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleSort('stock_quantity')}>
                  <div className="flex items-center gap-1">Stock {sortField === 'stock_quantity' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}</div>
                </th>
                <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition" onClick={() => handleSort('unitPrice')}>
                  <div className="flex items-center gap-1">Price {sortField === 'unitPrice' ? (sortDir === 'asc' ? <ArrowUp className="w-3 h-3"/> : <ArrowDown className="w-3 h-3"/>) : <ArrowUpDown className="w-3 h-3 text-slate-400"/>}</div>
                </th>
                {(canEditProduct || canDeleteProduct) && <th className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-300 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-slate-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">No active products match your filters.</td>
                </tr>
              ) : (
                paginatedData.map((p) => {
                  const isLow = (p.stock_quantity ?? 0) <= (p.low_stock_threshold ?? 0);
                  const isOut = (p.stock_quantity ?? 0) <= 0;
                  return (
                  <tr key={p.prodCode} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">
                       {p.prodCode}
                       {p.sku && <div className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</div>}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{p.description}</td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                       <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{p.category || 'Uncategorized'}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          <span className={`font-semibold ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-slate-700 dark:text-slate-300'}`}>
                            {p.stock_quantity ?? 0} <span className="text-xs font-normal text-slate-400 uppercase">{p.unit}</span>
                          </span>
                          {isOut ? <span className="text-[10px] bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-1.5 py-0.5 rounded font-bold uppercase">Empty</span> : 
                           isLow ? <span className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded font-bold uppercase">Low</span> : null}
                       </div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-emerald-600 dark:text-emerald-400">${p.unitPrice?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    {(canEditProduct || canDeleteProduct) && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {canEditProduct && (
                            <button onClick={() => handleOpenEdit(p)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded transition-colors" title="Edit">
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canDeleteProduct && (
                            <button 
                              onClick={() => triggerDelete(p.prodCode)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )})
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/50">
           <div className="text-sm text-slate-500 dark:text-slate-400">
             Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredAndSorted.length)} of {filteredAndSorted.length} entries
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <span className="text-sm text-slate-500 dark:text-slate-400">Rows per page:</span>
                 <select 
                    value={itemsPerPage} 
                    onChange={e => {setItemsPerPage(Number(e.target.value)); setCurrentPage(1);}}
                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded text-sm p-1 outline-none text-slate-700 dark:text-slate-300"
                 >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                 </select>
              </div>
              <div className="flex gap-1">
                 <button 
                   disabled={currentPage === 1} 
                   onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                   className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                 >Prev</button>
                 <span className="px-3 py-1 text-sm text-slate-600 dark:text-slate-300 font-medium">
                    {currentPage} / {totalPages || 1}
                 </span>
                 <button 
                   disabled={currentPage === totalPages || totalPages === 0} 
                   onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                   className="px-3 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                 >Next</button>
              </div>
           </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
           <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl border dark:border-slate-700 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-200 my-auto">
              <div className="flex justify-between items-center p-4 border-b dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10 rounded-t-lg">
                 <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   {isEditing ? <Edit className="w-5 h-5 text-indigo-500" /> : <PackagePlus className="w-5 h-5 text-indigo-500" />}
                   {isEditing ? 'Edit Product Data' : 'Add New Product'}
                 </h2>
                 <button type="button" onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleFormSubmit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
                 {/* Core Information */}
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Core Identity</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Product Code *</label>
                          <input 
                            required 
                            disabled={isEditing}
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500" 
                            value={formData.prodCode} 
                            onChange={e => setFormData({...formData, prodCode: e.target.value.toUpperCase()})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">SKU / Barcode</label>
                          <input 
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.sku} 
                            onChange={e => setFormData({...formData, sku: e.target.value})}
                          />
                       </div>
                       <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                          <input 
                            required 
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.description} 
                            onChange={e => setFormData({...formData, description: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Taxonomy & Sourcing */}
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Taxonomy & Sourcing</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Category</label>
                          <input 
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.category} 
                            onChange={e => setFormData({...formData, category: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Supplier</label>
                          <input 
                            type="text" 
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.supplier} 
                            onChange={e => setFormData({...formData, supplier: e.target.value})}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Inventory & Pricing */}
                 <div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-white border-b dark:border-slate-700 pb-2 mb-3">Inventory & Pricing</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Unit Type *</label>
                          <input 
                            required 
                            type="text" 
                            placeholder="ea, box, pc"
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.unit} 
                            onChange={e => setFormData({...formData, unit: e.target.value.toLowerCase()})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Stock Quantity</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.stock_quantity} 
                            onChange={e => setFormData({...formData, stock_quantity: e.target.value})}
                          />
                       </div>
                       <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Low Stock Alert Level</label>
                          <input 
                            type="number" 
                            step="0.01"
                            className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none" 
                            value={formData.low_stock_threshold} 
                            onChange={e => setFormData({...formData, low_stock_threshold: e.target.value})}
                          />
                       </div>
                       <div className="sm:col-span-3">
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                             {isEditing ? 'Current Active Price (Ledger Sync)' : 'Initial Baseline Price'} *
                          </label>
                          <div className="relative">
                             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                             <input 
                               required 
                               type="number" 
                               step="0.01"
                               min="0"
                               className="w-full pl-7 pr-3 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 outline-none font-medium" 
                               value={formData.initialPrice} 
                               onChange={e => setFormData({...formData, initialPrice: e.target.value})}
                             />
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-800 pb-2">
                    <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 border dark:border-slate-600 rounded-md text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 font-medium transition-colors">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                      {isEditing ? 'Save Product Data' : 'Create Product Baseline'}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}

      <ActionConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => {
          setDeleteModalOpen(false);
          setProductToDelete(null);
        }} 
        onVerified={handleDeleteConfirmed} 
        actionTitle={productToDelete ? `Archive Product: ${productToDelete}?` : ''}
      />
    </div>
  );
}
