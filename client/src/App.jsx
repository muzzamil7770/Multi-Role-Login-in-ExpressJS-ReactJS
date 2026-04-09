import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import useAuthStore from './store/authStore'
import { PrivateRoute, AdminRoute } from './components/RouteGuard'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import ProductsPage from './pages/ProductsPage'
import UsersPage from './pages/UsersPage'
import ProfilePage from './pages/ProfilePage'
import NotFoundPage from './pages/NotFoundPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
})

function AppRoutes() {
  const { fetchMe } = useAuthStore()

  useEffect(() => { fetchMe() }, [fetchMe])

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<PrivateRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontSize: '14px', borderRadius: '10px' },
            success: { iconTheme: { primary: '#0F6F82', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  )
}
