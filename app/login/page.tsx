"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const data = await api.post<{ access_token: string; user_id: string }>(
        "/login",
        { email, password }
      )
      const redirect = searchParams.get("redirect") || "/"
      console.log("LoginPage: Login successful, redirecting to", redirect);
      login(data.access_token, { email, id: data.user_id })
      router.push(redirect)
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-0 animate-fade-in overflow-hidden" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '-10%', left: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.12, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '-5%', width: '700px', height: '700px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10" style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.6) inset',
        border: '1px solid rgba(255,255,255,0.3)',
        padding: '52px'
      }}>
        {/* Logo/Icon area */}
        <div className="flex justify-center mb-8">
           <div style={{
             width: '64px',
             height: '64px',
             background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
             borderRadius: '18px',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             boxShadow: '0 10px 20px rgba(99,102,241,0.25)'
           }}>
             <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>
           </div>
        </div>

        <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.04em' }}>Welcome Back</h1>
        <p style={{ fontSize: '1.05rem', color: '#64748b', textAlign: 'center', marginBottom: '40px', fontWeight: 500 }}>Sign in to manage your team polls</p>
        
        {error && (
          <div style={{
            background: '#fef2f2',
            color: '#dc2626',
            padding: '16px',
            borderRadius: '14px',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '28px',
            border: '1px solid #fee2e2',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginLeft: '4px' }}>Email Address</label>
            <input
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '2px solid rgba(226, 232, 240, 0.8)',
                borderRadius: '16px',
                padding: '14px 18px',
                fontSize: '1rem',
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
              className="focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none"
            />
          </div>
          
          <div className="grid gap-2">
            <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#475569', marginLeft: '4px' }}>Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '2px solid rgba(226, 232, 240, 0.8)',
                  borderRadius: '16px',
                  padding: '14px 18px',
                  paddingRight: '52px',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'all 0.2s'
                }}
                className="focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 outline-none"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            style={{
              marginTop: '12px',
              padding: '16px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.1rem',
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 25px rgba(99,102,241,0.3)',
              cursor: 'pointer',
              transition: 'all 0.3s'
            }}
            className="hover:-translate-y-1 hover:shadow-2xl active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Authenticating...
              </span>
            ) : "Sign In to Account"}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', fontSize: '0.925rem', color: '#64748b', fontWeight: 600 }}>
          Don't have an account?{" "}
          <Link href="/register" style={{ color: '#4f46e5', fontWeight: 800, textDecoration: 'none' }} className="hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}
