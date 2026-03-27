"use client"

import { useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

export default function CreatePollPage() {
  const { id: teamId } = useParams()
  const router = useRouter()
  const { user, loading } = useAuth()

  const [title, setTitle] = useState("")
  const [about, setAbout] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [choices, setChoices] = useState(["", ""])
  const [multipleChoice, setMultipleChoice] = useState(false)
  const [creating, setCreating] = useState(false)

  const addChoice = () => setChoices([...choices, ""])
  const updateChoice = (i: number, val: string) => {
    const next = [...choices]
    next[i] = val
    setChoices(next)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || choices.some(c => !c.trim())) return
    
    setCreating(true)
    try {
      // Convert local time to UTC for MySQL
      let formattedDate = null;
      if (closesAt) {
        const localDate = new Date(closesAt);
        // Format as YYYY-MM-DD HH:mm:ss in UTC
        formattedDate = localDate.toISOString().replace("T", " ").replace("Z", "").split(".")[0];
      }
      
      await api.post(`/teams/${teamId}/polls`, {
        title,
        about,
        multiple_choice: multipleChoice,
        closes_at: formattedDate,
        choices: choices.filter(c => c.trim() !== "")
      })
      router.push(`/teams/${teamId}`)
    } catch (err) {
      alert("Failed to create poll")
    } finally {
      setCreating(false)
    }
  }

  if (loading) return null
  if (!user) return <div className="container py-20 text-center">Please login.</div>

  return (
    <div className="container py-12 animate-fade-in max-w-2xl">
      <Link href={`/teams/${teamId}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-6">
        ← Back to Team
      </Link>
      
      <div className="glass-card p-10">
        <h1 className="text-3xl mb-8">Create Team Poll</h1>
        
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Poll Question</label>
            <input 
              placeholder="What's your favorite coding language?" 
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Context/Description (Optional)</label>
            <textarea 
              placeholder="Add more details about this poll..."
              rows={3}
              value={about}
              onChange={e => setAbout(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Closing Time</label>
            <input 
              type="datetime-local" 
              value={closesAt}
              onChange={e => setClosesAt(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              className="w-5 h-5"
              checked={multipleChoice}
              onChange={e => setMultipleChoice(e.target.checked)}
            />
            <label className="text-sm font-semibold text-slate-700">Allow Multiple Choices</label>
          </div>

          <div className="grid gap-4 mt-4">
            <label className="text-sm font-semibold text-slate-700">Options</label>
            {choices.map((choice, i) => (
              <input 
                key={i}
                placeholder={`Option ${i + 1}`}
                value={choice}
                onChange={e => updateChoice(i, e.target.value)}
                required
              />
            ))}
            <button 
              type="button" 
              onClick={addChoice}
              className="bg-slate-50 text-slate-600 border border-slate-200 shadow-none hover:bg-slate-100"
            >
              + Add Another Option
            </button>
          </div>

          <button type="submit" className="mt-6" disabled={creating}>
            {creating ? "Creating..." : "Launch Poll"}
          </button>
        </form>
      </div>
    </div>
  )
}
