import { useState } from 'react'
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
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/productService'
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
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: products, isLoading } = useQuery({ queryKey: ['products'], queryFn: getProducts })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditing(null); reset({ name: '', price: '' }); setModalOpen(true) }
  const openEdit = (p) => { setEditing(p); reset({ name: p.name, price: p.price }); setModalOpen(true) }

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? updateProduct(editing.uuid, data) : createProduct(data),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['products'] })
      setModalOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(deleteTarget.uuid),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['products'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Delete failed'),
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
        onOpenChange={setModalOpen}
        title={editing ? 'Edit Product' : 'Add Product'}
      >
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
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || saveMutation.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              {saveMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Layout>
  )
}
