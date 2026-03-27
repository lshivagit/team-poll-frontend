"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"

type User = {
  id?: string | number
  email: string
}

type AuthContextType = {
  user: User | null
  loading: boolean
  login: (token: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const initAuth = () => {
      console.log("Auth: Initializing auth state...");
      const storedToken = localStorage.getItem("auth_token")
      const storedUser = localStorage.getItem("user")

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser))
          console.log("Auth: User logged in as", JSON.parse(storedUser).email);
        } catch (e) {
          console.error("Auth: Failed to parse user", e)
          localStorage.removeItem("auth_token")
          localStorage.removeItem("user")
          setUser(null)
        }
      } else {
        console.log("Auth: No user found in storage");
        setUser(null)
      }
      setLoading(false)
    }

    initAuth()

    const handleStorageChange = (e: StorageEvent) => {
      console.log("Auth: Storage change detected", e.key);
      if (e.key === "auth_token" || e.key === "user") {
        initAuth()
      }
    }
    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const login = (token: string, userData: User) => {
    localStorage.setItem("auth_token", token)
    localStorage.setItem("user", JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem("auth_token")
    localStorage.removeItem("user")
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
