import { useState } from 'react'
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
import { getUsers, createUser, updateUser, deleteUser } from '../services/userService'

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
  password: z.string().optional(),
  confPassword: z.string().optional(),
  role: z.enum(['admin', 'user']),
}).refine((d) => d.password === d.confPassword, {
  message: 'Passwords do not match',
  path: ['confPassword'],
})

export default function UsersPage() {
  const qc = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: users, isLoading } = useQuery({ queryKey: ['users'], queryFn: getUsers })

  const schema = editing ? editSchema : createSchema
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const openCreate = () => { setEditing(null); reset({ name: '', email: '', password: '', confPassword: '', role: 'user' }); setModalOpen(true) }
  const openEdit = (u) => { setEditing(u); reset({ name: u.name, email: u.email, password: '', confPassword: '', role: u.role }); setModalOpen(true) }

  const saveMutation = useMutation({
    mutationFn: (data) => editing ? updateUser(editing.uuid, data) : createUser(data),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['users'] })
      setModalOpen(false)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Operation failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(deleteTarget.uuid),
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['users'] })
      setDeleteTarget(null)
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Delete failed'),
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
                          onClick={() => setDeleteTarget(u)}
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
      <Modal open={modalOpen} onOpenChange={setModalOpen} title={editing ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="flex flex-col gap-4">
          <FormField label="Full Name" error={errors.name?.message}>
            <Input placeholder="John Doe" {...register('name')} />
          </FormField>
          <FormField label="Email" error={errors.email?.message}>
            <Input type="email" placeholder="john@example.com" {...register('email')} />
          </FormField>
          <FormField label={editing ? 'New Password (leave blank to keep)' : 'Password'} error={errors.password?.message}>
            <Input type="password" placeholder="••••••••" {...register('password')} />
          </FormField>
          <FormField label="Confirm Password" error={errors.confPassword?.message}>
            <Input type="password" placeholder="••••••••" {...register('confPassword')} />
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
              {saveMutation.isPending ? 'Saving…' : editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        onConfirm={() => deleteMutation.mutate()}
      />
    </Layout>
  )
}
