import { useQuery } from '@tanstack/react-query'
import { Package, Users, ShieldCheck } from 'lucide-react'
import Layout from '../components/Layout'
import { CardSkeleton } from '../components/Skeleton'
import useAuthStore from '../store/authStore'
import { getProducts } from '../services/productService'
import { getUsers } from '../services/userService'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  })

  const { data: users, isLoading: loadingUsers } = useQuery({
    queryKey: ['users'],
    queryFn: getUsers,
    enabled: isAdmin,
  })

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">
          Hello, <span className="font-medium text-primary-500">{user?.name}</span> 👋
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loadingProducts ? (
          <CardSkeleton />
        ) : (
          <StatCard
            icon={Package}
            label="Total Products"
            value={products?.length ?? 0}
            color="bg-primary-500"
          />
        )}

        {isAdmin && (
          loadingUsers ? (
            <CardSkeleton />
          ) : (
            <StatCard
              icon={Users}
              label="Total Users"
              value={users?.length ?? 0}
              color="bg-violet-500"
            />
          )
        )}

        <StatCard
          icon={ShieldCheck}
          label="Your Role"
          value={user?.role ?? '—'}
          color="bg-emerald-500"
        />
      </div>

      <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-700 mb-1">Account Info</h3>
        <div className="text-sm text-slate-500 space-y-1 mt-3">
          <p><span className="font-medium text-slate-700">Name:</span> {user?.name}</p>
          <p><span className="font-medium text-slate-700">Email:</span> {user?.email}</p>
          <p><span className="font-medium text-slate-700">Role:</span> <span className="capitalize">{user?.role}</span></p>
        </div>
      </div>
    </Layout>
  )
}
