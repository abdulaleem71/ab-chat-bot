import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProductCard, CommerceProduct } from '../../types';
import {
  ShoppingBag,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  Filter,
  Tag,
  Package,
  Layers,
  Sparkles,
  Sliders,
  Check,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface CatalogSyncManagerProps {
  onNavigateToIntegrations?: () => void;
}

export const CatalogSyncManager: React.FC<CatalogSyncManagerProps> = ({
  onNavigateToIntegrations,
}) => {
  const { token } = useAuth();
  const [products, setProducts] = useState<CommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'shopify' | 'woocommerce' | 'custom'>('all');
  const [syncMessage, setSyncMessage] = useState<{ text: string; success: boolean } | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    title: '',
    price: '',
    currency: 'USD',
    imageUrl: '',
    variantTitle: '',
    productUrl: '',
    description: '',
    sku: '',
    inStock: true,
    storePlatform: 'custom' as 'custom' | 'shopify' | 'woocommerce',
  });

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem('auth_token') || token;
    return {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {}),
    };
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commerce/products', { headers: getAuthHeaders() });
      const data = await res.json();
      if (data.success && Array.isArray(data.products)) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [token]);

  const handleSyncNow = async (platform: 'shopify' | 'woocommerce') => {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/commerce/sync', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ storePlatform: platform }),
      });
      const data = await res.json();
      if (data.success) {
        setSyncMessage({ text: data.message || `Synchronized ${data.count} items.`, success: true });
        await fetchProducts();
      } else {
        setSyncMessage({ text: data.error || 'Failed to sync catalog.', success: false });
      }
    } catch (err: any) {
      setSyncMessage({ text: 'Sync error: ' + err.message, success: false });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.title.trim() || !newProduct.price) return;

    try {
      const res = await fetch('/api/commerce/products', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(newProduct),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewProduct({
          title: '',
          price: '',
          currency: 'USD',
          imageUrl: '',
          variantTitle: '',
          productUrl: '',
          description: '',
          sku: '',
          inStock: true,
          storePlatform: 'custom',
        });
        await fetchProducts();
      } else {
        alert(data.error || 'Failed to add product');
      }
    } catch (err: any) {
      alert('Error adding product: ' + err.message);
    }
  };

  const filteredProducts = products.filter(p => {
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (p.title && p.title.toLowerCase().includes(q)) ||
      (p.variantTitle && p.variantTitle.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q));
    const matchesPlatform = selectedPlatform === 'all' || p.storePlatform === selectedPlatform;
    return matchesSearch && matchesPlatform;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-zinc-200/90 rounded-3xl p-6 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-zinc-950 text-white rounded-xl">
              <ShoppingBag className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-zinc-950 font-heading">E-Commerce Product Catalog</h2>
          </div>
          <p className="text-xs text-zinc-500 font-medium font-body">
            Automated live catalog ingestion with periodic sync schedules for grounded product recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSyncNow('shopify')}
            disabled={syncing}
            className="py-2 px-3.5 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Ingest catalog from Shopify Storefront"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync Shopify</span>
          </button>

          <button
            type="button"
            onClick={() => handleSyncNow('woocommerce')}
            disabled={syncing}
            className="py-2 px-3.5 text-xs font-bold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Ingest catalog from WooCommerce REST API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync WooCommerce</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="py-2 px-4 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Item</span>
          </button>
        </div>
      </div>

      {/* Sync Status Banner */}
      {syncMessage && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl text-xs font-medium border flex items-center justify-between gap-3 ${
            syncMessage.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {syncMessage.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{syncMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setSyncMessage(null)}
            className="p-1 hover:bg-black/5 rounded-md"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      )}

      {/* Refresh Schedule & Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-heading">Catalog Volume</span>
            <p className="text-lg font-extrabold text-zinc-950 font-heading">{products.length} Products</p>
            <span className="text-[11px] text-emerald-600 font-medium">All indexed for AI Carousel</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-heading">Auto-Sync Schedule</span>
            <p className="text-sm font-extrabold text-zinc-950 font-heading">Hourly Cron Trigger</p>
            <span className="text-[11px] text-zinc-500 font-medium">Next run in ~24 min</span>
          </div>
        </div>

        <div className="bg-white border border-zinc-200/90 rounded-2xl p-4.5 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center text-zinc-900 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase font-heading">Active In Commerce Bots</span>
            <p className="text-sm font-extrabold text-zinc-950 font-heading">Direct Tool-Calling</p>
            <span className="text-[11px] text-zinc-500 font-medium">search_catalog enabled</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white border border-zinc-200/90 rounded-2xl p-3 shadow-2xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, variant..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950 focus:bg-white transition placeholder-zinc-400"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
          {(['all', 'shopify', 'woocommerce', 'custom'] as const).map(plat => (
            <button
              key={plat}
              onClick={() => setSelectedPlatform(plat)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition capitalize whitespace-nowrap cursor-pointer ${
                selectedPlatform === plat
                  ? 'bg-zinc-950 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
              }`}
            >
              {plat === 'all' ? 'All Platforms' : plat}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table (Task 2 Spec: id, title, price, image, variant, URL, refresh schedule + Sync Now) */}
      <div className="bg-white border border-zinc-200/90 rounded-3xl overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-zinc-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
            <span>Loading product catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 space-y-3">
            <ShoppingBag className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-semibold">No products found matching your filter.</p>
            <button
              onClick={() => handleSyncNow('shopify')}
              className="text-xs font-bold text-zinc-900 underline underline-offset-4 hover:text-black cursor-pointer"
            >
              Sync Shopify demo catalog now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-zinc-50/80 text-[11px] font-bold text-zinc-500 uppercase tracking-wider border-b border-zinc-200/80">
                <tr>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Platform</th>
                  <th className="py-3 px-4">Variant / SKU</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Synced At</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredProducts.map(p => (
                  <tr key={p.id} className="hover:bg-zinc-50/60 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-100 border border-zinc-200 overflow-hidden shrink-0">
                          {p.imageUrl ? (
                            <img
                              src={p.imageUrl}
                              alt={p.title}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <ShoppingBag className="w-4 h-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-extrabold text-zinc-900 line-clamp-1">{p.title}</p>
                          <span className="text-[10px] font-mono text-zinc-400">ID: {p.productId}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        p.storePlatform === 'shopify'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : p.storePlatform === 'woocommerce'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-zinc-100 text-zinc-700'
                      }`}>
                        {p.storePlatform}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-zinc-600">
                      <p className="font-medium truncate max-w-[140px]">{p.variantTitle || 'Default Variant'}</p>
                      {p.sku && <span className="text-[10px] text-zinc-400 font-mono">SKU: {p.sku}</span>}
                    </td>

                    <td className="py-3 px-4 font-bold text-zinc-900 font-mono">
                      ${p.price.toFixed(2)} {p.currency}
                    </td>

                    <td className="py-3 px-4">
                      {p.inStock ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          In Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-zinc-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                          Out of Stock
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-[11px] text-zinc-500 font-mono">
                      {new Date(p.syncedAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {p.productUrl ? (
                        <a
                          href={p.productUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 inline-flex items-center justify-center text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition cursor-pointer"
                          title="Open product link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      ) : (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Manual Product Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-zinc-200"
            >
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                <h3 className="text-base font-extrabold text-zinc-950 font-heading">Add Product Item</h3>
                <button onClick={() => setShowAddModal(false)} className="p-1 text-zinc-400 hover:text-zinc-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Product Title *</label>
                  <input
                    type="text"
                    required
                    value={newProduct.title}
                    onChange={e => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g. Ergonomic Office Chair"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Price ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={newProduct.price}
                      onChange={e => setNewProduct(prev => ({ ...prev, price: e.target.value }))}
                      placeholder="89.99"
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-800 mb-1">Currency</label>
                    <input
                      type="text"
                      value={newProduct.currency}
                      onChange={e => setNewProduct(prev => ({ ...prev, currency: e.target.value.toUpperCase() }))}
                      className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Image URL</label>
                  <input
                    type="url"
                    value={newProduct.imageUrl}
                    onChange={e => setNewProduct(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Product Store URL</label>
                  <input
                    type="url"
                    value={newProduct.productUrl}
                    onChange={e => setNewProduct(prev => ({ ...prev, productUrl: e.target.value }))}
                    placeholder="https://yourstore.com/products/chair"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">Variant / SKU</label>
                  <input
                    type="text"
                    value={newProduct.variantTitle}
                    onChange={e => setNewProduct(prev => ({ ...prev, variantTitle: e.target.value }))}
                    placeholder="e.g. Matte Black / SKU-9001"
                    className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 focus:outline-hidden focus:border-zinc-950"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-xs font-bold text-zinc-600 hover:bg-zinc-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-extrabold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl shadow-xs"
                  >
                    Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
