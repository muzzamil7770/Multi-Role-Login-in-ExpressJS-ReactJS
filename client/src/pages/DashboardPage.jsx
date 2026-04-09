import { useQuery } from '@tanstack/react-query'
import { Package, Users, ShieldCheck, TrendingUp, Calendar } from 'lucide-react'
import Layout from '../components/Layout'
import { CardSkeleton } from '../components/Skeleton'
import { getDashboardStats } from '../services/dashboardService'

function StatCard({ icon: Icon, label, value, color, subtitle }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 flex items-center gap-4 hover:shadow-lg transition-shadow duration-300">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  )
}

function ProgressBar({ label, percentage, color }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">{percentage}%</span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-1000 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
  })

  const user = data?.user
  const stats = data?.stats

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">
          {isLoading ? (
            <div className="h-4 bg-slate-200 rounded animate-pulse w-48 inline-block" />
          ) : (
            <>Hello, <span className="font-medium text-primary-500">{user?.name}</span> 👋</>
          )}
        </p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : isError ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">Failed to load dashboard data. Please try again.</p>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              icon={Package}
              label="Total Products"
              value={stats?.totalProducts ?? 0}
              color="bg-primary-500"
              subtitle="Across all users"
            />

            <StatCard
              icon={Users}
              label="Total Users"
              value={stats?.totalUsers ?? 0}
              color="bg-violet-500"
              subtitle="Active accounts"
            />

            <StatCard
              icon={ShieldCheck}
              label="Your Role"
              value={user?.role ?? '—'}
              color="bg-emerald-500"
              subtitle={`Since ${new Date(user?.createdAt).toLocaleDateString()}`}
            />
          </div>

          {/* Role Distribution */}
          <div className="mt-8 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-primary-500" />
              <h3 className="font-semibold text-slate-700 text-lg">User Role Distribution</h3>
            </div>
            <ProgressBar
              label="Admin Users"
              percentage={stats?.roleDistribution?.admin?.percentage ?? 0}
              color="bg-violet-500"
            />
            <ProgressBar
              label="Regular Users"
              percentage={stats?.roleDistribution?.user?.percentage ?? 0}
              color="bg-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Admin: {stats?.roleDistribution?.admin?.count ?? 0}</span>
              <span>Users: {stats?.roleDistribution?.user?.count ?? 0}</span>
            </div>
          </div>

          {/* Product Distribution */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package size={20} className="text-primary-500" />
              <h3 className="font-semibold text-slate-700 text-lg">Product Ownership Distribution</h3>
            </div>
            <ProgressBar
              label="Admin Products"
              percentage={stats?.productDistribution?.adminProducts?.percentage ?? 0}
              color="bg-violet-500"
            />
            <ProgressBar
              label="User Products"
              percentage={stats?.productDistribution?.userProducts?.percentage ?? 0}
              color="bg-emerald-500"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-2">
              <span>Admin: {stats?.productDistribution?.adminProducts?.count ?? 0}</span>
              <span>Users: {stats?.productDistribution?.userProducts?.count ?? 0}</span>
            </div>
          </div>

          {/* Account Info */}
          <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-primary-500" />
              <h3 className="font-semibold text-slate-700 text-lg">Account Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Full Name</p>
                  <p className="font-medium text-slate-800">{user?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Email Address</p>
                  <p className="font-medium text-slate-800">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-400 mb-1">Account Role</p>
                  <p className="font-medium text-slate-800 capitalize">{user?.role}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-1">Member Since</p>
                  <p className="font-medium text-slate-800">
                    {new Date(user?.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Users (if admin) */}
          {user?.role === 'admin' && data?.recentUsers && (
            <div className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Users size={20} className="text-primary-500" />
                <h3 className="font-semibold text-slate-700 text-lg">Recent Users</h3>
              </div>
              <div className="space-y-3">
                {data.recentUsers.map((u) => (
                  <div
                    key={u.uuid}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin'
                          ? 'bg-violet-100 text-violet-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  )
}
