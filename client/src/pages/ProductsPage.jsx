import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, PackageOpen } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField, { Input } from '../components/FormField'
import { TableSkeleton } from '../components/Skeleton'
import { getProducts, getProductById, createProduct, updateProduct, deleteProduct } from '../services/productService'
import useAuthStore from '../store/authStore'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  price: z.coerce.number({ invalid_type_error: 'Price must be a number' }).positive('Price must be positive'),
})

export default function ProductsPage() {
  const qc = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts })

  // Fetch product by ID for edit modal
  const { data: editingProduct, isLoading: loadingEdit } = useQuery({
    queryKey: ['product', editingId],
    queryFn: () => getProductById(editingId),
    enabled: !!editingId && modalOpen,
  })

  // Fetch product by ID for delete confirmation
  const { data: deleteProductData, isLoading: loadingDelete } = useQuery({
    queryKey: ['product', deleteTargetId],
    queryFn: () => getProductById(deleteTargetId),
    enabled: !!deleteTargetId,
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditingId(null); reset({ name: '', price: '' }); setModalOpen(true) }
  const openEdit = (p) => { setEditingId(p.uuid); setModalOpen(true) }

  // Populate form when edit data loads
  useEffect(() => {
    if (editingProduct) {
      reset({ name: editingProduct.name, price: editingProduct.price })
    }
  }, [editingProduct, reset])

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? updateProduct(editingId, data) : createProduct(data),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
      setEditingId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(deleteTargetId),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteTargetId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Delete failed'),
  })

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Products</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your product catalog</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Price</th>
                {isAdmin && <th className="px-4 py-3 text-left font-semibold text-slate-600">Owner</th>}
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton cols={isAdmin ? 5 : 4} />
              ) : products?.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="py-16 text-center text-slate-400">
                    <PackageOpen size={40} className="mx-auto mb-2 opacity-40" />
                    No products found
                  </td>
                </tr>
              ) : (
                products?.map((p, i) => (
                  <tr key={p.uuid} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">${p.price.toLocaleString()}</td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-slate-500">{p.user?.name}</td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={modalOpen}
        onOpenChange={(v) => { setModalOpen(v); if (!v) setEditingId(null); }}
        title={editingId ? 'Edit Product' : 'Add Product'}
      >
        {loadingEdit ? (
          <div className="space-y-4 py-2">
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="flex justify-end gap-3">
              <div className="h-9 bg-slate-200 rounded w-20 animate-pulse" />
              <div className="h-9 bg-slate-200 rounded w-20 animate-pulse" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="flex flex-col gap-4">
            <FormField label="Product Name" error={errors.name?.message}>
              <Input placeholder="e.g. Wireless Mouse" {...register('name')} />
            </FormField>
            <FormField label="Price ($)" error={errors.price?.message}>
              <Input type="number" placeholder="e.g. 29" {...register('price')} />
            </FormField>
            <div className="flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => { setModalOpen(false); setEditingId(null); }}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || saveMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
              >
                {saveMutation.isPending ? 'Saving…' : editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(v) => { if (!v) setDeleteTargetId(null); }}
        title="Delete Product"
        description={
          loadingDelete
            ? 'Loading product details…'
            : `Are you sure you want to delete "${deleteProductData?.name}"? This action cannot be undone.`
        }
        onConfirm={() => deleteMutation.mutate()}
      />
    </Layout>
  )
}
