import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { User, Mail, Lock, Save, AlertTriangle, Monitor, LogOut, Bell, Check, X, Trash2, Smartphone, Tablet, Laptop } from 'lucide-react'
import Layout from '../components/Layout'
import { getProfile, updateProfile, deleteAccount, getSessions, terminateSession, terminateAllSessions } from '../services/profileService'
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from '../services/notificationService'
import { useSocket } from '../hooks/useSocket'
import useAuthStore from '../store/authStore'
import ConfirmDialog from '../components/ConfirmDialog'

const profileSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').optional(),
  email: z.string().email('Enter a valid email').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  confPassword: z.string().optional().or(z.literal('')),
}).refine((data) => {
  if (data.password && data.password !== data.confPassword) {
    return false
  }
  return true
}, {
  message: 'Passwords do not match',
  path: ['confPassword'],
})

function TabButton({ active, onClick, icon: Icon, label, badge }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-primary-500 text-white'
          : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <Icon size={16} />
      {label}
      {badge > 0 && (
        <span className={`ml-1 px-2 py-0.5 text-xs rounded-full ${
          active ? 'bg-white text-primary-500' : 'bg-red-500 text-white'
        }`}>
          {badge}
        </span>
      )}
    </button>
  )
}

function SessionCard({ session, onTerminate, isCurrent }) {
  const getDeviceIcon = () => {
    const os = session.os?.toLowerCase() || ''
    if (os.includes('android')) return Smartphone
    if (os.includes('ios')) return Smartphone
    if (os.includes('windows') || os.includes('mac')) return Laptop
    return Monitor
  }

  const Icon = getDeviceIcon()

  return (
    <div className={`p-4 rounded-lg border-2 transition-colors ${
      isCurrent ? 'border-primary-500 bg-primary-50' : 'border-slate-200 bg-white'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className={`p-2 rounded-lg ${isCurrent ? 'bg-primary-500' : 'bg-slate-100'}`}>
            <Icon size={20} className={isCurrent ? 'text-white' : 'text-slate-600'} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-medium text-slate-800">{session.browser}</p>
              {isCurrent && (
                <span className="px-2 py-0.5 text-xs bg-primary-500 text-white rounded-full">
                  Current
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{session.os}</p>
            <div className="mt-2 space-y-1 text-xs text-slate-400">
              <p>IP: {session.ipAddress}</p>
              <p>Login: {new Date(session.loginTime).toLocaleString()}</p>
              <p>Last activity: {new Date(session.lastActivity).toLocaleString()}</p>
            </div>
          </div>
        </div>
        {!isCurrent && (
          <button
            onClick={() => onTerminate(session.uuid)}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Terminate session"
          >
            <LogOut size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

function NotificationItem({ notification, onMarkRead, onDelete }) {
  const typeColors = {
    login_alert: 'bg-red-50 border-red-200',
    profile_update: 'bg-blue-50 border-blue-200',
    security: 'bg-orange-50 border-orange-200',
    system: 'bg-purple-50 border-purple-200',
    info: 'bg-green-50 border-green-200'
  }

  const typeIcons = {
    login_alert: AlertTriangle,
    profile_update: User,
    security: Lock,
    system: Monitor,
    info: Bell
  }

  const Icon = typeIcons[notification.type] || Bell

  return (
    <div className={`p-4 rounded-lg border ${typeColors[notification.type] || 'bg-white border-slate-200'} ${
      !notification.isRead ? 'ring-2 ring-primary-200' : ''
    }`}>
      <div className="flex items-start gap-3">
        <Icon size={20} className="text-slate-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-slate-800">{notification.title}</p>
              <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
              <p className="text-xs text-slate-400 mt-2">
                {new Date(notification.createdAt).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkRead(notification.uuid)}
                  className="p-1.5 text-primary-500 hover:bg-primary-50 rounded transition-colors"
                  title="Mark as read"
                >
                  <Check size={14} />
                </button>
              )}
              <button
                onClick={() => onDelete(notification.uuid)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Delete notification"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const qc = useQueryClient()
  const { user: authUser } = useAuthStore()
  const { notifications: socketNotifications, setSocketNotifications } = useSocket()
  const [activeTab, setActiveTab] = useState('profile')
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confPassword: ''
    }
  })

  // Profile query
  const { data: profileData, isLoading: loadingProfile } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  })

  // Sessions query
  const { data: sessions, isLoading: loadingSessions } = useQuery({
    queryKey: ['sessions'],
    queryFn: getSessions,
    enabled: activeTab === 'sessions'
  })

  // Notifications query
  const { data: notificationsData, isLoading: loadingNotifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => getNotifications({ limit: 50 }),
    enabled: activeTab === 'notifications'
  })

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (res) => {
      toast.success(res.msg)
      qc.invalidateQueries({ queryKey: ['profile'] })
      reset({ name: '', email: '', password: '', confPassword: '' })
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Update failed')
  })

  const deleteMutation = useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted')
      useAuthStore.getState().logout()
      window.location.href = '/login'
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Delete failed')
  })

  const terminateSessionMutation = useMutation({
    mutationFn: terminateSession,
    onSuccess: () => {
      toast.success('Session terminated')
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Failed')
  })

  const terminateAllMutation = useMutation({
    mutationFn: terminateAllSessions,
    onSuccess: () => {
      toast.success('All other sessions terminated')
      qc.invalidateQueries({ queryKey: ['sessions'] })
    },
    onError: (err) => toast.error(err?.response?.data?.msg || 'Failed')
  })

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Failed to mark as read')
  })

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      toast.success('All notifications marked as read')
      qc.invalidateQueries({ queryKey: ['notifications'] })
      qc.invalidateQueries({ queryKey: ['profile'] })
    },
    onError: () => toast.error('Failed to mark all as read')
  })

  const deleteNotifMutation = useMutation({
    mutationFn: deleteNotification,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
    onError: () => toast.error('Failed to delete notification')
  })

  const onSubmit = (data) => {
    const payload = {}
    if (data.name) payload.name = data.name
    if (data.email) payload.email = data.email
    if (data.password) {
      payload.password = data.password
      payload.confPassword = data.confPassword
    }
    updateMutation.mutate(payload)
  }

  const user = profileData?.user || authUser
  const unreadCount = profileData?.unreadNotifications || 0

  const tabs = [
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'sessions', icon: Monitor, label: 'Sessions', badge: sessions?.length || 0 },
    { id: 'notifications', icon: Bell, label: 'Notifications', badge: unreadCount }
  ]

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your account, sessions, and notifications</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(tab => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            icon={tab.icon}
            label={tab.label}
            badge={tab.badge || 0}
          />
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Profile Information</h3>
          
          {loadingProfile ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-10 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <User size={14} className="inline mr-1" /> Name
                  </label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    placeholder={user?.name}
                    {...register('name')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    <Mail size={14} className="inline mr-1" /> Email
                  </label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    placeholder={user?.email}
                    {...register('email')}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-sm text-primary-500 hover:text-primary-600 font-medium"
                >
                  {showPassword ? 'Hide password fields' : 'Change password'}
                </button>

                {showPassword && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Lock size={14} className="inline mr-1" /> New Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        {...register('password')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        <Lock size={14} className="inline mr-1" /> Confirm Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        {...register('confPassword')}
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                      />
                      {errors.confPassword && <p className="text-xs text-red-500 mt-1">{errors.confPassword.message}</p>}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => reset({ name: '', email: '', password: '', confPassword: '' })}
                  className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Reset
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || updateMutation.isPending}
                  className="flex items-center gap-2 px-6 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
                >
                  <Save size={16} />
                  {isSubmitting || updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-red-200">
            <h4 className="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
              <AlertTriangle size={16} /> Danger Zone
            </h4>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="px-4 py-2 text-sm rounded-lg border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      )}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Active Sessions</h3>
            <button
              onClick={() => terminateAllMutation.mutate()}
              disabled={terminateAllMutation.isPending || (sessions?.length || 0) <= 1}
              className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-60"
            >
              Logout All Other Devices
            </button>
          </div>

          {loadingSessions ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : sessions?.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Monitor size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No active sessions found</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sessions?.map(session => (
                <SessionCard
                  key={session.uuid}
                  session={session}
                  isCurrent={session.isCurrent}
                  onTerminate={(id) => terminateSessionMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-slate-800">Notifications</h3>
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              className="px-4 py-2 text-sm rounded-lg bg-primary-500 text-white hover:bg-primary-600 transition-colors disabled:opacity-60"
            >
              Mark All as Read
            </button>
          </div>

          {loadingNotifications ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-slate-200 rounded animate-pulse" />
              ))}
            </div>
          ) : notificationsData?.notifications?.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
              <Bell size={48} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No notifications</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationsData?.notifications?.map(notif => (
                <NotificationItem
                  key={notif.uuid}
                  notification={notif}
                  onMarkRead={(id) => markReadMutation.mutate(id)}
                  onDelete={(id) => deleteNotifMutation.mutate(id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Account Confirmation */}
      <ConfirmDialog
        open={deleteConfirm}
        onOpenChange={setDeleteConfirm}
        title="Delete Account"
        description="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost."
        onConfirm={() => deleteMutation.mutate()}
      />
    </Layout>
  )
}
