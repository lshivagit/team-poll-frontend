"use client"

import Link from "next/link"
import { useAuth } from "@/context/AuthContext"

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="glass-border border-b bg-white dark:bg-slate-900 sticky top-0 z-50">
      <div className="container py-4 flex justify-between items-center">
        <Link href="/" className="text-3xl font-black italic tracking-tighter text-indigo-600 dark:text-indigo-400">
          TEAM<span className="text-slate-900 dark:text-white">POLL</span>
        </Link>
        
        <div className="flex-1 flex justify-end items-center gap-6">
          {user ? (
            <div className="flex items-center gap-6">
              <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{user.email}</span>
              <button onClick={logout} className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-indigo-600 dark:hover:bg-indigo-400 text-base font-black px-6 py-2.5 transition-all duration-300 shadow-md">
                Logout
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  )
}
