"use client";

import { useEffect, useState, useRef } from "react";
import { uploadImage } from "@/lib/uploadImage";

// ─── Types ───────────────────────────────────────────────────────────
interface ProductRow {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: string;
  isAvailable: boolean;
  primaryImageUrl?: string | null;
  sku?: string;
}

interface ModalState {
  mode: "add" | "edit" | null;
  product: Partial<ProductRow> | null;
}

// ─── Small helper components ─────────────────────────────────────────

function Spinner() {
  return (
    <span className="material-symbols-outlined animate-spin text-primary text-xl">
      progress_activity
    </span>
  );
}

function ConfirmDialog({
  product,
  onConfirm,
  onCancel,
}: {
  product: ProductRow;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm mx-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
          <span className="material-symbols-outlined text-red-500 text-3xl">delete_forever</span>
        </div>
        <h3 className="text-lg font-black text-slate-900 text-center mb-1">Delete Product?</h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          <span className="font-bold text-slate-700">{product.name}</span> will be permanently
          removed from inventory and Supabase.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductModal({
  modal,
  categories,
  onClose,
  onSave,
}: {
  modal: ModalState;
  categories: string[];
  onClose: () => void;
  onSave: (data: Partial<ProductRow>) => Promise<void>;
}) {
  const [form, setForm] = useState<Partial<ProductRow>>(modal.product || {});
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);

  const isEdit = modal.mode === "edit";

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    try {
      const url = await uploadImage(file, "product-images");
      setForm((f) => ({ ...f, primaryImageUrl: url }));
      setErrorMsg(null);
    } catch {
      setErrorMsg("Image upload failed. Bucket might not be public.");
    } finally {
      setUploadingImg(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim() || !form.price || !form.categoryId) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    setErrorMsg(null);
    setSaving(true);
    try {
      await onSave({ ...form, price: Number(form.price) });
    } finally {
      setSaving(false);
    }
  };

  const imgSrc =
    form.primaryImageUrl ||
    (form.name
      ? `https://loremflickr.com/200/200/${encodeURIComponent(form.name)},food/all`
      : `https://loremflickr.com/200/200/food/all`);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg font-black text-slate-900">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h2>
          <button
            onClick={onClose}
            className="material-symbols-outlined text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full p-1 transition-all"
          >
            close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold animate-shake flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {errorMsg}
            </div>
          )}
          {/* Image upload */}
          <div className="flex items-center gap-5">
            <div className="relative w-20 h-20 flex-shrink-0">
              <img
                src={imgSrc}
                alt="Product"
                className={`w-20 h-20 rounded-xl object-cover border border-slate-200 shadow-sm ${uploadingImg ? "opacity-50 grayscale" : ""}`}
              />
              {uploadingImg && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              <button
                type="button"
                onClick={() => imgRef.current?.click()}
                disabled={uploadingImg}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-all"
              >
                <span className="material-symbols-outlined text-[14px]">photo_camera</span>
              </button>
              <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImagePick} />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Product Name *
              </label>
              <input
                type="text"
                value={form.name || ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Hazelnut Cold Coffee"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Price (₹) *
              </label>
              <input
                type="number"
                min={0}
                step={0.01}
                value={form.price || ""}
                onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) }))}
                placeholder="0.00"
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
                Category *
              </label>
              <select
                value={form.categoryId || ""}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value, category: e.target.options[e.target.selectedIndex].text }))}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, isAvailable: !f.isAvailable }))}
              className={`relative w-11 h-6 rounded-full transition-colors ${form.isAvailable ? "bg-green-500" : "bg-slate-200"}`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${form.isAvailable ? "translate-x-5" : "translate-x-0.5"}`}
              />
            </button>
            <span className="text-sm font-semibold text-slate-700">
              {form.isAvailable ? "Available (In Stock)" : "Unavailable (Out of Stock)"}
            </span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Spinner /> : null}
              {isEdit ? "Save Changes" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ mode: null, product: null });
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const loadData = async () => {
    const { fetchProducts, fetchCategories } = await import("@/lib/api");
    const [prodRes, catRes] = await Promise.all([fetchProducts(), fetchCategories()]);
    setProducts(prodRes.data || []);
    setCategories(catRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Derived filtered list ──────────────────────────────────────────
  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.category || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.sku || "").toLowerCase().includes(search.toLowerCase())
      )
    : products;

  // ── Handlers ──────────────────────────────────────────────────────
  const handleUpdate = async (productId: string, data: any) => {
    const { updateProduct } = await import("@/lib/api");
    await updateProduct(productId, data);
    setProducts((cur) => cur.map((p) => (p.id === productId ? { ...p, ...data } : p)));
  };

  const handleImageUpload = async (productId: string, file: File) => {
    setUploadingId(productId);
    try {
      const url = await uploadImage(file, "product-images");
      await handleUpdate(productId, { primaryImageUrl: url });
    } catch {
      // Inline error logged to console for now, can be improved with a toast
      console.error("Image upload failed");
    } finally {
      setUploadingId(null);
    }
  };

  const handleSave = async (data: Partial<ProductRow>) => {
    if (modal.mode === "add") {
      const { addProduct } = await import("@/lib/api");
      const res = await addProduct({
        name: data.name!,
        price: data.price!,
        categoryId: data.categoryId!,
        isAvailable: data.isAvailable ?? true,
        primaryImageUrl: data.primaryImageUrl || undefined,
      });
      setProducts((cur) => [...cur, res.data]);
    } else if (modal.mode === "edit" && modal.product?.id) {
      await handleUpdate(modal.product.id, data);
    }
    setModal({ mode: null, product: null });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { deleteProduct } = await import("@/lib/api");
    await deleteProduct(deleteTarget.id);
    setProducts((cur) => cur.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  return (
    <>
      {/* ── Modals ── */}
      {modal.mode && (
        <ProductModal
          modal={modal}
          categories={categories}
          onClose={() => setModal({ mode: null, product: null })}
          onSave={handleSave}
        />
      )}
      {deleteTarget && (
        <ConfirmDialog
          product={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Page ── */}
      <div className="p-8 max-w-7xl mx-auto font-sans h-full flex flex-col pb-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Inventory Management
            </h1>
            <p className="text-slate-500 font-medium mt-0.5">
              Manage pricing and availability for{" "}
              <span className="font-bold text-slate-700">{products.length}</span> items.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Inline search */}
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search products…"
                className="pl-9 pr-4 py-2.5 text-sm font-medium border border-slate-200 rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all w-52"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 hover:text-slate-600 text-[16px]"
                >
                  close
                </button>
              )}
            </div>

            <button
              onClick={() => setModal({ mode: "add", product: { isAvailable: true } })}
              className="bg-primary hover:bg-primary/90 active:scale-95 text-white font-bold py-2.5 px-5 rounded-xl shadow-sm transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-widest text-slate-500 font-bold">
                <tr>
                  <th className="p-4 pl-6">Product Item</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Base Price</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-400 font-medium">
                        <Spinner /> Loading inventory…
                      </div>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-slate-400 font-medium">
                      {search ? `No products matching "${search}"` : "No products found."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors group">
                      {/* Product + image */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-4">
                          <label className="relative cursor-pointer group/img w-12 h-12 flex-shrink-0">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              disabled={uploadingId === p.id}
                              onChange={(e) => {
                                if (e.target.files?.[0]) handleImageUpload(p.id, e.target.files[0]);
                              }}
                            />
                            <img
                              src={
                                p.primaryImageUrl ||
                                `https://loremflickr.com/200/200/${encodeURIComponent(p.name)},food/all`
                              }
                              alt={p.name}
                              className={`w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-sm transition-all ${uploadingId === p.id ? "opacity-40 grayscale" : "group-hover/img:opacity-70"}`}
                            />
                            <div className="absolute inset-0 rounded-xl flex items-center justify-center">
                              {uploadingId === p.id ? (
                                <Spinner />
                              ) : (
                                <div className="bg-black/40 rounded-xl absolute inset-0 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                  <span className="material-symbols-outlined text-white text-[16px]">
                                    upload
                                  </span>
                                </div>
                              )}
                            </div>
                          </label>
                          <span className="font-bold text-slate-900">{p.name}</span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-4 text-sm font-semibold text-slate-500">
                        {p.category || p.categoryId || "—"}
                      </td>

                      {/* Price */}
                      <td className="p-4">
                        <div className="flex items-center gap-1 bg-slate-100 w-max px-3 py-1.5 rounded-lg border border-slate-200 focus-within:border-primary focus-within:bg-white transition-all">
                          <span className="text-slate-400 font-bold text-sm">₹</span>
                          <input
                            type="number"
                            defaultValue={p.price?.toFixed ? p.price.toFixed(2) : p.price}
                            className="bg-transparent w-16 outline-none font-bold text-slate-900 text-sm"
                            onBlur={(e) => {
                              const v = parseFloat(e.target.value);
                              if (v && v !== p.price) handleUpdate(p.id, { price: v });
                            }}
                          />
                        </div>
                      </td>

                      {/* SKU */}
                      <td className="p-4 text-xs font-bold font-mono tracking-widest text-slate-400">
                        {p.sku || "—"}
                      </td>

                      {/* Status toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleUpdate(p.id, { isAvailable: !p.isAvailable })}
                          className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full transition-colors ${
                            p.isAvailable
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-red-100 text-red-700 hover:bg-red-200"
                          }`}
                        >
                          {p.isAvailable ? "In Stock" : "Out of Stock"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal({ mode: "edit", product: p })}
                            title="Edit product"
                            className="text-slate-400 hover:text-primary transition-colors p-2 rounded-lg hover:bg-primary/5"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </button>
                          <button
                            onClick={() => setDeleteTarget(p)}
                            title="Delete product"
                            className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          {!loading && (
            <div className="px-6 py-3 border-t border-slate-100 text-xs text-slate-400 font-medium shrink-0">
              Showing {filtered.length} of {products.length} products
              {search && ` · filtered by "${search}"`}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
