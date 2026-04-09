import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import useAuthStore from '../store/authStore'
import FormField, { Input, Select } from '../components/FormField'
import { UserPlus, Sparkles } from 'lucide-react'

const schema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confPassword: z.string().min(1, 'Please confirm password'),
  role: z.enum(['admin', 'user'], { required_error: 'Select a role' }),
}).refine((d) => d.password === d.confPassword, {
  message: 'Passwords do not match',
  path: ['confPassword'],
})

export default function RegisterPage() {
  const { register: registerUser } = useAuthStore()
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confPassword: '',
      role: 'user',
    },
  })

  const onSubmit = async (data) => {
    try {
      await registerUser(data.name, data.email, data.password, data.confPassword, data.role)
      toast.success('Account created successfully! Please login.')
      navigate('/login')
    } catch (err) {
      toast.error(err?.response?.data?.msg || err?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-primary-100 to-primary-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-20 w-32 h-32 bg-primary-200 rounded-full opacity-20 blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-primary-300 rounded-full opacity-20 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-primary-400 rounded-full opacity-10 blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }} />
      </div>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative z-10 border border-primary-100">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg animate-pulse">
            <UserPlus size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 bg-gradient-to-r from-primary-500 to-primary-700 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-slate-500 text-sm mt-2">Join us today and get started!</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Full Name" error={errors.name?.message}>
              <Input
                type="text"
                placeholder="John Doe"
                {...register('name')}
              />
            </FormField>

            <FormField label="Email address" error={errors.email?.message}>
              <Input
                type="email"
                placeholder="you@example.com"
                {...register('email')}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Password" error={errors.password?.message}>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('password')}
              />
            </FormField>

            <FormField label="Confirm Password" error={errors.confPassword?.message}>
              <Input
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                {...register('confPassword')}
              />
            </FormField>
          </div>

          <FormField label="Role" error={errors.role?.message}>
            <Select {...register('role')}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </Select>
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 w-full py-3 rounded-lg bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold text-sm hover:from-primary-600 hover:to-primary-700 active:from-primary-700 active:to-primary-800 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Creating Account…
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Create Account
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-primary-500 font-medium hover:text-primary-600 hover:underline transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  )
}
