import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks'
import { getRoleHomePath } from '../lib/roleRouting'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { signIn, loading, error, isAuthenticated, user } = useAuth()

  // Redirect if already authenticated → role home
  useEffect(() => {
    if (!isAuthenticated || !user) return
    navigate(getRoleHomePath(user.role), { replace: true })
  }, [isAuthenticated, user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const result = await signIn(email, password)
      if (result.error) {
        console.error('Login failed:', result.error)
      }
    } catch (err) {
      console.error('Login error:', err)
    }
  }

  const handleTestLogin = (testEmail, testPassword) => {
    setEmail(testEmail)
    setPassword(testPassword)
  }

  return (
    <div className="min-h-screen flex">

      {/* ── LEFT PANEL — Hero Image ── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* HD background image — WASH / water & sanitation in Africa */}
        <img
          src="https://images.unsplash.com/photo-1594398901394-4e34939a4fd0?w=1400&q=90&auto=format&fit=crop"
          alt="Clean water and sanitation in Northern Ghana"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1CABE2]/90 via-[#0077B6]/80 to-[#023E8A]/90" />

        {/* Content over image */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">

          {/* Top — UNICEF-style badge */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 40 40" className="w-7 h-7" fill="none">
                <circle cx="20" cy="20" r="20" fill="#1CABE2"/>
                <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
                  fill="white" fontSize="11" fontWeight="bold" fontFamily="Arial">SS</text>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-none">SaniSentinel</p>
              <p className="text-blue-200 text-xs">UNICEF StartUp Lab 2026</p>
            </div>
          </div>

          {/* Middle — headline */}
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-white text-xs font-medium tracking-wide uppercase">
                Live Monitoring Active
              </span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight">
              Climate-Resilient<br />
              <span className="text-[#7FDBFF]">Sanitation</span><br />
              Monitoring
            </h1>

            <p className="text-blue-100 text-base leading-relaxed max-w-sm">
              Real-time visibility into sanitation facilities across Northern Ghana.
              Early warnings before climate shocks strike.
            </p>

            {/* Stats row */}
            <div className="flex space-x-6 pt-2">
              {[
                { value: '18', label: 'Districts' },
                { value: '200+', label: 'Facilities' },
                { value: '6h', label: 'Update Cycle' },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                  <p className="text-blue-200 text-xs">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom — attribution */}
          <div className="flex items-center space-x-3">
            <div className="h-px flex-1 bg-white/20" />
            <p className="text-blue-200 text-xs whitespace-nowrap">
              University for Development Studies · Nyankpala
            </p>
            <div className="h-px flex-1 bg-white/20" />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Login Form ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center bg-white px-8 sm:px-16 xl:px-24 py-12">

        {/* Mobile logo (hidden on desktop) */}
        <div className="flex lg:hidden items-center space-x-3 mb-10">
          <div className="w-10 h-10 bg-[#1CABE2] rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-sm">SS</span>
          </div>
          <div>
            <p className="font-bold text-gray-900">SaniSentinel</p>
            <p className="text-xs text-gray-500">Climate-Resilient Sanitation</p>
          </div>
        </div>

        <div className="max-w-sm w-full mx-auto">

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-1">Welcome back</h2>
            <p className="text-gray-500 text-sm">Sign in to access the monitoring dashboard</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Email address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </span>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1CABE2] focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1CABE2] focus:border-transparent transition-all bg-gray-50 hover:bg-white"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start space-x-2 bg-red-50 border border-red-100 rounded-xl p-3">
                <svg className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl text-sm font-semibold text-white
                bg-[#1CABE2] hover:bg-[#0099CC] active:bg-[#0077B6]
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1CABE2]
                disabled:opacity-60 disabled:cursor-not-allowed
                transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <span>Signing in…</span>
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 h-px bg-gray-100" />
            <span className="px-3 text-xs text-gray-400 font-medium">Demo accounts</span>
            <div className="flex-1 h-px bg-gray-100" />
          </div>

          {/* Test accounts */}
          <div className="space-y-2.5">
            {[
              {
                label: 'System Administrator',
                email: 'admin@sanissentinel.com',
                password: 'SaniSentinel2024!',
                icon: '🛡️',
                color: 'bg-purple-50 border-purple-100 hover:border-purple-300',
                badge: 'Admin',
                badgeColor: 'bg-purple-100 text-purple-700',
              },
              {
                label: 'District Officer — Tamale',
                email: 'officer@tamale.gov',
                password: 'Tamale2024!',
                icon: '📍',
                color: 'bg-blue-50 border-blue-100 hover:border-blue-300',
                badge: 'Officer',
                badgeColor: 'bg-blue-100 text-blue-700',
              },
            ].map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => handleTestLogin(account.email, account.password)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-150 ${account.color}`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{account.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{account.label}</p>
                    <p className="text-xs text-gray-500">{account.email}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${account.badgeColor}`}>
                  {account.badge}
                </span>
              </button>
            ))}
          </div>

          <p className="text-center text-xs text-gray-400 mt-3">
            Click an account to auto-fill, then press Sign in
          </p>

          {/* Footer */}
          <div className="mt-10 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              Built for{' '}
              <span className="font-semibold text-[#1CABE2]">UNICEF StartUp Lab Hackathon 2026</span>
              {' '}· Northern Ghana
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
