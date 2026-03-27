"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Team = {
  id: string
  name: string
}

export default function TeamsPage() {
  const { user, loading } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [name, setName] = useState("")
  const [fetching, setFetching] = useState(true)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (user) {
      api.get<Team[]>("/teams")
        .then(setTeams)
        .catch(console.error)
        .finally(() => setFetching(false))
    }
  }, [user])

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setCreating(true)
    try {
      const newTeam = await api.post<Team>("/teams", { name })
      setTeams([...teams, newTeam])
      setName("")
    } catch (err) {
      alert("Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return null
  if (!user) return <div className="container py-20 text-center">Please login to view teams.</div>

  return (
    <div className="container py-12 animate-fade-in">
      <h1 className="text-4xl mb-8">My Teams</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="grid gap-4">
            {fetching ? (
              <p>Loading teams...</p>
            ) : teams.length === 0 ? (
              <div className="glass-card p-12 text-center text-slate-500">
                You are not a member of any teams yet.
              </div>
            ) : (
            teams.map(team => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="glass-card p-6 flex justify-between items-center hover:border-indigo-400 cursor-pointer transition-colors">
                  <div>
                    <h3 className="text-lg">{team.name}</h3>
                    <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Team ID: {team.id}</p>
                  </div>
                  <button className="bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50 shadow-none">
                    View Polls
                  </button>
                </div>
              </Link>
            ))
            )}
          </div>
        </div>

        <div>
          <div className="glass-card p-8 sticky top-24">
            <h3 className="mb-4">Create New Team</h3>
            <form onSubmit={handleCreateTeam} className="grid gap-4">
              <div className="grid gap-2">
                <label className="text-sm font-semibold text-slate-700">Team Name</label>
                <input
                  placeholder="e.g. Design Team, Engineering"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" disabled={creating}>
                {creating ? "Creating..." : "Create Team"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
