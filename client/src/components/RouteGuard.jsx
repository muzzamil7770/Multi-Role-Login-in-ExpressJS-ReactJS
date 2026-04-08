import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

export function PrivateRoute() {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>
  return user ? <Outlet /> : <Navigate to="/login" replace />
}

export function AdminRoute() {
  const { user, isLoading } = useAuthStore()
  if (isLoading) return <div className="flex items-center justify-center h-screen"><Spinner /></div>
  if (!user) return <Navigate to="/login" replace />
  return user.role === 'admin' ? <Outlet /> : <Navigate to="/dashboard" replace />
}

function Spinner() {
  return (
    <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  )
}
