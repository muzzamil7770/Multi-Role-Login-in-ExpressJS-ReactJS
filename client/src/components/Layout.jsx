import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Users, LogOut, Menu, X, Settings } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/profile', label: 'Settings', icon: Settings },
]

const adminItems = [
  { to: '/users', label: 'Users', icon: Users },
]

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const links = user?.role === 'admin' ? [...navItems, ...adminItems] : navItems

  const NavLinks = () => (
    <nav className="flex flex-col gap-1 flex-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-500 text-white'
                : 'text-slate-600 hover:bg-primary-50 hover:text-primary-500'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-white border-r border-slate-200 p-4">
        <div className="mb-8 px-2">
          <h1 className="text-xl font-bold text-primary-500">AppManager</h1>
          <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role} · {user?.name}</p>
        </div>
        <NavLinks />
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-2"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14">
        <h1 className="text-lg font-bold text-primary-500">AppManager</h1>
        <button onClick={() => setOpen(!open)} className="text-slate-600">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={() => setOpen(false)}>
          <aside
            className="absolute left-0 top-0 h-full w-64 bg-white p-4 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-8 px-2 mt-2">
              <h1 className="text-xl font-bold text-primary-500">AppManager</h1>
              <p className="text-xs text-slate-400 mt-0.5 capitalize">{user?.role} · {user?.name}</p>
            </div>
            <NavLinks />
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors mt-2"
            >
              <LogOut size={18} /> Logout
            </button>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pt-0 pt-14">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
