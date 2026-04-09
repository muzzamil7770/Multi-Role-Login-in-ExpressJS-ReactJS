import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Pencil, Trash2, UsersIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import Layout from '../components/Layout'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import FormField, { Input, Select } from '../components/FormField'
import { TableSkeleton } from '../components/Skeleton'
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../services/userService'

const createSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confPassword: z.string().min(1, 'Please confirm password'),
  role: z.enum(['admin', 'user'], { required_error: 'Select a role' }),
}).refine((d) => d.password === d.confPassword, {
  message: 'Passwords do not match',
  path: ['confPassword'],
})

const editSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().optional().or(z.literal('')),
  confPassword: z.string().optional().or(z.literal('')),
  role: z.enum(['admin', 'user']),
}).refine((d) => {
  if (d.password && d.password !== d.confPassword) return false
  return true
}, {
  message: 'Passwords do not match',
  path: ['confPassword'],
})

export default function UsersPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  // Fetch user by ID for edit modal
  const { data: editingUser, isLoading: loadingEdit } = useQuery({
    queryKey: ['user', editingId],
    queryFn: () => getUserById(editingId),
    enabled: !!editingId && modalOpen,
  })

  // Fetch user by ID for delete confirmation
  const { data: deleteUserData, isLoading: loadingDelete } = useQuery({
    queryKey: ['user', deleteTargetId],
    queryFn: () => getUserById(deleteTargetId),
    enabled: !!deleteTargetId,
  })

  const isEditing = !!editingId
  const schema = isEditing ? editSchema : createSchema
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  // Populate form when edit data loads
  useEffect(() => {
    if (editingUser) {
      reset({
        name: editingUser.name,
        email: editingUser.email,
        password: '',
        confPassword: '',
        role: editingUser.role
      })
    }
  }, [editingUser, reset])

  // Reset form on modal close
  useEffect(() => {
    if (!modalOpen) {
      setEditingId(null)
      reset({ name: '', email: '', password: '', confPassword: '', role: 'user' })
    }
  }, [modalOpen, reset])

  const openCreate = () => { setEditingId(null); setModalOpen(true) }
  const openEdit = (u) => { setEditingId(u.uuid); setModalOpen(true) }

  const saveMutation = useMutation({
    mutationFn: (data) => editingId ? updateUser(editingId, data) : createUser(data),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(deleteTargetId),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['users'] })
      setDeleteTargetId(null)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Delete failed'),
  })

  const roleBadge = (role) => (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
      role === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-emerald-100 text-emerald-700'
    }`}>
      {role}
    </span>
  )

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Users</h2>
          <p className="text-slate-500 text-sm mt-1">Manage system users</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-4 py-3 text-left font-semibold text-slate-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Email</th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">Role</th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <TableSkeleton cols={5} />
              ) : users?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400">
                    <UsersIcon size={40} className="mx-auto mb-2 opacity-40" />
                    No users found
                  </td>
                </tr>
              ) : (
                users?.map((u, i) => (
                  <tr key={u.uuid} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-400">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">{u.name}</td>
                    <td className="px-4 py-3 text-slate-500">{u.email}</td>
                    <td className="px-4 py-3">{roleBadge(u.role)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:bg-primary-50 hover:text-primary-500 transition-colors"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTargetId(u.uuid)}
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
        title={isEditing ? 'Edit User' : 'Add User'}
      >
        {loadingEdit ? (
          <div className="space-y-4 py-2">
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="h-10 bg-slate-200 rounded animate-pulse" />
            <div className="flex justify-end gap-3">
              <div className="h-9 bg-slate-200 rounded w-20 animate-pulse" />
              <div className="h-9 bg-slate-200 rounded w-20 animate-pulse" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="flex flex-col gap-4">
            <FormField label="Full Name" error={errors.name?.message}>
              <Input placeholder="John Doe" {...register('name')} />
            </FormField>
            <FormField label="Email" error={errors.email?.message}>
              <Input type="email" placeholder="john@example.com" {...register('email')} />
            </FormField>
            <FormField label={isEditing ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password?.message}>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />
            </FormField>
            <FormField label="Confirm Password" error={errors.confPassword?.message}>
              <Input type="password" placeholder="••••••••" autoComplete="new-password" {...register('confPassword')} />
            </FormField>
            <FormField label="Role" error={errors.role?.message}>
              <Select {...register('role')}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Select>
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
                {saveMutation.isPending ? 'Saving…' : isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTargetId}
        onOpenChange={(v) => { if (!v) setDeleteTargetId(null); }}
        title="Delete User"
        description={
          loadingDelete
            ? 'Loading user details…'
            : `Are you sure you want to delete "${deleteUserData?.name}"? This action cannot be undone.`
        }
        onConfirm={() => deleteMutation.mutate()}
      />
    </Layout>
  )
}
