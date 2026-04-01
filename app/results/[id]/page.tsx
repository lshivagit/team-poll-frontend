"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

type Choice = {
  choice_id: number
  text: string
  votes: number
  percentage: number
}

export default function ResultsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [results, setResults] = useState<Choice[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      console.log("ResultsPage: No user, redirecting to login");
      router.push(`/login?redirect=/results/${id}`)
      return
    }

    const token = localStorage.getItem("auth_token")
    const abortController = new AbortController()

    const connectStream = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/polls/${id}/stream`, {
          headers: {
            "Authorization": `Bearer ${token}`
          },
          signal: abortController.signal
        })

        if (!response.ok) {
          if (response.status === 403) {
            setError("You do not have permission to view these results.")
          } else {
            setError("Failed to connect to results stream.")
          }
          return
        }

        const reader = response.body?.getReader()
        if (!reader) return

        const decoder = new TextDecoder()
        let buffer = ""

        while (true) {
          const { value, done } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() || ""

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))
                setResults(data.results)
                setTotalVotes(data.total_votes)
              } catch (e) {
                console.error("Error parsing SSE data:", e)
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Stream error:", err)
          setError("Connection to live stream lost.")
        }
      }
    }

    connectStream()

    return () => abortController.abort()
  }, [id, user, authLoading])

  if (authLoading || (!results.length && !error)) {
    return (
      <div className="container py-20 text-center">
        <p className="text-slate-500">Connecting to secure results stream...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-20 text-center">
        <div className="glass-card p-12 max-w-xl mx-auto border-rose-100 bg-rose-50/20">
          <h2 className="text-rose-600 mb-4">Access Restricted</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-800 shadow-none hover:bg-slate-200">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 animate-fade-in max-w-2xl">
      <div className="glass-card p-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl">Live Results</h1>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Updates</span>
          </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl mb-10 flex justify-between items-center">
          <span className="font-semibold text-slate-600 uppercase text-sm tracking-wide">Total Votes Cast</span>
          <span className="text-3xl font-black text-indigo-600">{totalVotes}</span>
        </div>

        <div className="grid gap-8">
          {results.map((r) => (
            <div key={r.choice_id}>
              <div className="flex justify-between items-end mb-3">
                <span className="font-bold text-lg text-slate-800">{r.text}</span>
                <span className="text-sm font-medium text-slate-500">{r.votes} votes • {r.percentage.toFixed(1)}%</span>
              </div>
              <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${r.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex justify-center">
          <button onClick={() => router.push("/")} className="bg-white text-slate-900 border border-slate-200 shadow-none hover:bg-slate-50">
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  )
}