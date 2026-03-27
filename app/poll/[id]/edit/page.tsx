"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Choice = {
  id: number
  option_text: string
}

type Poll = {
  id: string
  title: string
  about: string | null
  multiple_choice: boolean
  choices: Choice[]
  team_id: string
  created_by: string
  is_closed: boolean
  closes_at: string | null
}

export default function EditPollPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [poll, setPoll] = useState<Poll | null>(null)
  const [title, setTitle] = useState("")
  const [about, setAbout] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [choices, setChoices] = useState<{ id?: number; text: string }[]>([])
  const [multipleChoice, setMultipleChoice] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push(`/login?redirect=/poll/${id}/edit`)
      return
    }

    api.get<Poll>(`/polls/${id}`)
      .then(data => {
        if (data.created_by !== user.id) {
          setError("Only the creator can edit this poll.")
          setLoading(false)
          return
        }
        if (data.is_closed) {
          setError("This poll is closed and can no longer be edited.")
          setLoading(false)
          return
        }
        setPoll(data)
        setTitle(data.title)
        setAbout(data.about || "")
        setMultipleChoice(data.multiple_choice)
        setChoices(data.choices.map(c => ({ id: c.id, text: c.option_text })))
        
        if (data.closes_at) {
          // data.closes_at is "YYYY-MM-DD HH:mm:ss" UTC
          const utcDate = new Date(data.closes_at.replace(" ", "T") + "Z");
          // Convert to local YYYY-MM-DDTHH:mm
          const localISO = new Date(utcDate.getTime() - utcDate.getTimezoneOffset() * 60000).toISOString();
          setClosesAt(localISO.slice(0, 16));
        }
        
        setLoading(false)
      })
      .catch(err => {
        setError("Failed to load poll or poll not found.")
        setLoading(false)
      })
  }, [id, user, authLoading])

  const addChoice = () => setChoices([...choices, { text: "" }])
  const updateChoice = (i: number, val: string) => {
    const next = [...choices]
    next[i].text = val
    setChoices(next)
  }
  const removeChoice = (i: number) => {
    if (choices.length <= 2) return
    setChoices(choices.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || choices.some(c => !c.text.trim())) return
    
    setSaving(true)
    try {
      // Convert local time to UTC for MySQL
      let formattedDate = null;
      if (closesAt) {
        const localDate = new Date(closesAt);
        // Format as YYYY-MM-DD HH:mm:ss in UTC
        formattedDate = localDate.toISOString().replace("T", " ").replace("Z", "").split(".")[0];
      }

      await api.put(`/polls/${id}/edit`, {
        title,
        about,
        multiple_choice: multipleChoice,
        closes_at: formattedDate,
        choices: choices.map(c => ({ id: c.id, option_text: c.text }))
      })
      router.push(`/poll/${id}`)
    } catch (err: any) {
      setError(err.message || "Failed to update poll")
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) return <div className="container py-20 text-center">Loading poll details...</div>
  
  if (error) {
    return (
      <div className="container py-20 text-center">
        <div className="glass-card p-12 max-w-xl mx-auto border-rose-100 bg-rose-50/20">
          <h2 className="text-rose-600 mb-4">Edit Restricted</h2>
          <p className="text-slate-600 mb-8">{error}</p>
          <button onClick={() => router.push("/")} className="bg-slate-100 text-slate-800">
            Go to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-12 animate-fade-in max-w-2xl">
      <Link href={`/poll/${id}`} className="text-sm text-slate-500 hover:text-indigo-600 flex items-center gap-1 mb-6">
        ← Back to Poll
      </Link>
      
      <div className="glass-card p-10">
        <h1 className="text-3xl mb-8">Edit Poll</h1>
        
        <form onSubmit={handleSubmit} className="grid gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Poll Question</label>
            <input 
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-semibold text-slate-700">Context/Description</label>
            <textarea 
              rows={3}
              value={about}
              onChange={e => setAbout(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
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
              <div key={i} className="flex gap-2">
                <input 
                  className="flex-1"
                  placeholder={`Option ${i + 1}`}
                  value={choice.text}
                  onChange={e => updateChoice(i, e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  onClick={() => removeChoice(i)}
                  className="w-10 h-10 p-0 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border-slate-200"
                  disabled={choices.length <= 2}
                >
                  ×
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={addChoice}
              className="bg-slate-50 text-slate-600 border border-slate-200 shadow-none hover:bg-slate-100"
            >
              + Add Another Option
            </button>
          </div>

          <button type="submit" className="mt-6" disabled={saving}>
            {saving ? "Saving Changes..." : "Update Poll"}
          </button>
        </form>
      </div>
    </div>
  )
}
