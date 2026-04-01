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
}

export default function PollPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  
  const [poll, setPoll] = useState<Poll | null>(null)
  const [selected, setSelected] = useState<number[]>([])
  const [error, setError] = useState("")
  const [voting, setVoting] = useState(false)
  const [voted, setVoted] = useState(false)
  const [deniedTeamId, setDeniedTeamId] = useState<string | null>(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      console.log("PollPage: No user, redirecting to login");
      router.push(`/login?redirect=/poll/${id}`)
      return
    }

    api.get<Poll>(`/polls/${id}`)
      .then(setPoll)
      .catch((err: any) => {
        if (err.status === 403) {
          setError("You do not have permission to view or vote on this poll. Contact your team admin or join the team below.")
          if (err.data?.team_id) {
            setDeniedTeamId(err.data.team_id)
          }
        } else {
          setError("Failed to load poll or poll not found.")
        }
      })
  }, [id, user, authLoading])

  const toggleOption = (optionId: number) => {
    if (!poll) return
    if (poll.multiple_choice) {
      setSelected(prev =>
        prev.includes(optionId)
          ? prev.filter(i => i !== optionId)
          : [...prev, optionId]
      )
    } else {
      setSelected([optionId])
    }
  }

  const submitVote = async () => {
    if (selected.length === 0) return
    setVoting(true)
    setError("")

    try {
      await api.post(`/polls/${id}/vote`, {
        option_ids: selected
      })
      setVoted(true)
      setTimeout(() => router.push(`/results/${id}`), 1500)
    } catch (err: any) {
      setError(err.message || "Failed to submit vote")
    } finally {
      setVoting(false)
    }
  }

  const joinTeam = async () => {
    const targetTeamId = poll?.team_id || deniedTeamId
    if (!targetTeamId) return
    setVoting(true)
    try {
      await api.post(`/teams/${targetTeamId}/join`, {})
      setError("")
      setDeniedTeamId(null)
      // Refresh poll data
      api.get<Poll>(`/polls/${id}`).then(setPoll).catch(console.error)
    } catch (err: any) {
      setError(err.message || "Failed to join team")
    } finally {
      setVoting(false)
    }
  }

  if (authLoading || (!poll && !error)) {
    return (
      <div className="container py-20 text-center">
        <p className="text-slate-500">Loading secure poll...</p>
      </div>
    )
  }

  const copyLink = () => {
    const link = window.location.href
    navigator.clipboard.writeText(link)
    alert("Shareable link copied to clipboard!")
  }

  if (error) {
    const isForbidden = error.includes("permission") || error.includes("member");
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6 z-50 animate-fade-in" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.6) inset',
          border: '1px solid rgba(255,255,255,0.3)',
          padding: '48px',
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative gradients */}
          <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '200px', height: '200px', background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.15, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-80px', left: '-60px', width: '250px', height: '250px', background: 'radial-gradient(circle, #f43f5e 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />

          <div className="mx-auto mb-6 flex items-center justify-center rounded-full" style={{
            width: '72px',
            height: '72px',
            background: isForbidden ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'linear-gradient(135deg, #f43f5e, #fb7185)',
            boxShadow: isForbidden ? '0 12px 24px rgba(99,102,241,0.35), inset 0 2px 0 rgba(255,255,255,0.3)' : '0 12px 24px rgba(244,63,94,0.35), inset 0 2px 0 rgba(255,255,255,0.3)'
          }}>
            {isForbidden ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            )}
          </div>

          <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginBottom: '14px', letterSpacing: '-0.03em' }}>
            {isForbidden ? "Join Team to Participate" : "Access Restricted"}
          </h2>
          
          <p style={{ fontSize: '1.05rem', color: '#64748b', lineHeight: 1.6, marginBottom: '36px', fontWeight: 500 }}>
            {isForbidden 
              ? "This poll is exclusive to team members. Join the team now to make your voice heard and see the results live!" 
              : error}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {isForbidden && (poll?.team_id || deniedTeamId) && (
              <button 
                onClick={joinTeam} 
                disabled={voting}
                className="hover:-translate-y-1 active:translate-y-0 transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  padding: '18px',
                  borderRadius: '18px',
                  border: 'none',
                  boxShadow: '0 10px 25px rgba(99,102,241,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                {voting ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Joining Team...
                  </span>
                ) : "✨ Join Team & Cast Vote"}
              </button>
            )}

            <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
              <button 
                onClick={copyLink} 
                className="flex-1 hover:bg-slate-100 transition-colors"
                style={{
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
              >
                🔗 Copy Link
              </button>
              <button 
                onClick={() => router.push("/")} 
                className="flex-1 hover:bg-slate-100 transition-colors"
                style={{
                  background: 'white',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '1rem',
                  padding: '14px',
                  borderRadius: '14px',
                  border: '2px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  cursor: 'pointer'
                }}
              >
                🏠 Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 z-0 animate-fade-in overflow-y-auto" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)' }}>
      {/* Background decoration */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '400px', height: '400px', background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.08, pointerEvents: 'none' }} />

      <div className="w-full max-w-lg my-auto" style={{
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRadius: '32px',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.6) inset',
        border: '1px solid rgba(255,255,255,0.3)',
        padding: '36px',
        position: 'relative'
      }}>
        {/* Header Section */}
        <div className="flex flex-col mb-10">
          <div className="flex justify-between items-center mb-6">
            <Link href={`/teams/${poll?.team_id}`} className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5 no-underline">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to Team
            </Link>
            <div className="flex gap-2">
              <span style={{
                fontSize: '0.65rem',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '8px',
                background: '#eef2ff',
                color: '#6366f1',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                border: '1px solid #e0e7ff'
              }}>
                {poll?.multiple_choice ? 'Multiple Choice' : 'Single Choice'}
              </span>
              {voted && (
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  padding: '4px 10px',
                  borderRadius: '8px',
                  background: '#ecfdf5',
                  color: '#10b981',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  border: '1px solid #d1fae5'
                }}>
                  ✓ Voted
                </span>
              )}
            </div>
          </div>
          
          <h1 style={{ 
            fontSize: '2.1rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            marginBottom: '8px', 
            letterSpacing: '-0.04em',
            lineHeight: 1.12
          }}>
            {poll?.title}
          </h1>
          {poll?.about && (
            <p style={{ fontSize: '1rem', color: '#64748b', fontWeight: 500, lineHeight: 1.45 }}>
              {poll.about}
            </p>
          )}
        </div>

        {/* Options List */}
        <div className="grid gap-4">
          {poll?.choices.map(choice => {
            const isSelected = selected.includes(choice.id)
            return (
              <div 
                key={choice.id} 
                onClick={() => !voted && toggleOption(choice.id)}
                className={`group transition-all duration-300 ${voted ? 'cursor-default' : 'cursor-pointer'}`}
                  style={{
                  padding: '20px 24px',
                  borderRadius: '18px',
                  background: isSelected ? 'white' : 'rgba(255,255,255,0.4)',
                  border: isSelected ? '2px solid #6366f1' : '2px solid rgba(226, 232, 240, 0.6)',
                  boxShadow: isSelected ? '0 10px 20px -5px rgba(99,102,241,0.15)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: voted && !isSelected ? 0.6 : 1,
                  transform: isSelected && !voted ? 'translateY(-2px)' : 'none',
                }}
              >
                <span style={{ 
                  fontSize: '1.2rem', 
                  fontWeight: 700, 
                  color: isSelected ? '#1e293b' : '#475569',
                  transition: 'color 0.2s'
                }}>
                  {choice.option_text}
                </span>
                
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: poll?.multiple_choice ? '8px' : '50%',
                  border: '2px solid',
                  borderColor: isSelected ? '#6366f1' : '#cbd5e1',
                  background: isSelected ? '#6366f1' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none'
                }}>
                  {isSelected && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Section */}
        <div className="mt-12">
          <button 
            onClick={submitVote} 
            disabled={selected.length === 0 || voting || voted}
            className={`w-full py-5 rounded-2xl font-800 text-lg transition-all duration-300 ${voting || selected.length === 0 || voted ? 'cursor-not-allowed opacity-50' : 'hover:-translate-y-1 hover:shadow-xl active:translate-y-0'}`}
            style={{
              background: voted ? '#10b981' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              boxShadow: voted ? '0 10px 20px -5px rgba(16,185,129,0.3)' : '0 10px 25px -5px rgba(99,102,241,0.3)'
            }}
          >
            {voting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Submitting your vote...
              </span>
            ) : voted ? "✨ Response Recorded!" : "🚀 Cast My Vote"}
          </button>

          <div style={{ 
            marginTop: '24px', 
            padding: '16px', 
            borderRadius: '16px', 
            background: 'rgba(241, 245, 249, 0.5)',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
              Anonymous identification as <span style={{ color: '#4f46e5' }}>{user?.email}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}