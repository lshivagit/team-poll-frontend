"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/context/AuthContext"
import { api } from "@/lib/api"

type Team = {
  id: string
  name: string
}

export default function Home() {
  const { user, loading, login } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [fetching, setFetching] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loginLoading, setLoginLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFetching(true)
      api.get<Team[]>("/teams")
        .then(setTeams)
        .catch(console.error)
        .finally(() => setFetching(false))
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoginLoading(true)

    try {
      const data = await api.post<{ access_token: string; user_id: string }>(
        "/login",
        { email, password }
      )
      login(data.access_token, { email, id: data.user_id })
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoginLoading(false)
    }
  }

  if (loading) return null

  if (!user) {
    return (
      <div className="w-full h-[calc(100vh-64px)] flex flex-col items-center justify-center animate-fade-in overflow-hidden px-4" style={{ gap: '1rem' }}>
        {/* Branding Title above login box */}
        <div className="text-center">
          <h1 className="text-4xl font-black italic tracking-tighter text-indigo-600 drop-shadow-sm mb-0">
            WELCOME <span className="text-slate-900">BACK</span>
          </h1>
          <p className="text-base text-slate-500 font-medium mt-2">Decisions Made Simple. Together.</p>
        </div>

        {/* Centered Login Box */}
        <div className="glass-card p-6 w-full max-w-md shadow-xl border-indigo-100/30">
          <h2 className="text-lg font-bold text-center mb-4">Sign In</h2>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-2 rounded-lg text-xs mb-4 border border-red-100 animate-pulse font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="grid gap-3 text-left">
            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Email Address</label>
              <input
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-50/50 border-slate-200 h-10 text-sm"
              />
            </div>
            
            <div className="grid gap-1">
              <label className="text-xs font-bold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-slate-50/50 border-slate-200 h-10 text-sm"
                  style={{ paddingRight: '48px' }}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            <button type="submit" className="mt-2 w-full py-3 text-base font-bold" disabled={loginLoading}>
              {loginLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-slate-500 font-medium">
            Don't have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors underline decoration-2 underline-offset-4">
              Create an account
            </Link>
          </p>
        </div>

        {/* Features below login box - Horizontal left to right */}
        <div className="mt-4 flex flex-wrap justify-center gap-x-12 gap-y-4 w-full max-w-4xl">
          <div className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-indigo-50 rounded-md flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
            </div>
            <span className="font-bold tracking-tight text-slate-700 text-[10px]">Team Security</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-rose-50 rounded-md flex items-center justify-center text-rose-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
            </div>
            <span className="font-bold tracking-tight text-slate-700 text-[10px]">Real-Time Results</span>
          </div>
          <div className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-emerald-50 rounded-md flex items-center justify-center text-emerald-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
            </div>
            <span className="font-bold tracking-tight text-slate-700 text-[10px]">Clean Dashboard</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 animate-fade-in">
      <div className="mb-12">
        <h1 className="text-4xl font-bold">Welcome back, {user.email.split('@')[0]}</h1>
        
        <div className="mt-8 flex flex-col items-start gap-3">
          <p className="text-xl font-bold text-slate-800">Manage Teams:</p>
          <Link href="/teams">
            <button className="py-3 px-8 text-lg font-bold shadow-lg shadow-indigo-100">
              Create New Team
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {fetching ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="glass-card p-6 h-32 animate-pulse bg-slate-100" />
          ))
        ) : (
          teams.map(team => (
            <Link key={team.id} href={`/teams/${team.id}`}>
              <div className="glass-card p-6 hover:border-indigo-400 transition-colors">
                <h3 className="mb-2">{team.name}</h3>
                <p className="text-sm text-slate-500">Click to view active polls</p>
              </div>
            </Link>
          ))
        )}
      </div>

      {teams.length === 0 && !fetching && (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 mt-12">
          <p className="text-slate-500">You haven't joined any teams yet. Start by creating one!</p>
        </div>
      )}
    </div>
  )
}