"use client"

import { useEffect, useState, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { api } from "@/lib/api"
import { useAuth } from "@/context/AuthContext"

type Poll = {
  id: string
  title: string
  about: string | null
  closes_at: string | null
  status: string
  created_by: string
}

type Choice = {
  choice_id: number
  text: string
  votes: number
  percentage: number
}

const CHART_COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6']

// Premium donut-style pie chart with inner total count
function PollPieChart({ results, totalVotes }: { results: Choice[]; totalVotes: number }) {
  const size = 120
  const cx = size / 2
  const cy = size / 2
  const outerR = size / 2
  const innerR = outerR * 0.52 // donut hole

  let cumulativePercent = 0

  function polarToCartesian(pct: number, radius: number) {
    const angle = 2 * Math.PI * pct
    return [
      cx + radius * Math.cos(angle - Math.PI / 2),
      cy + radius * Math.sin(angle - Math.PI / 2),
    ]
  }

  const segments = results.map((item, i) => {
    if (item.percentage === 0) return null
    const startPct = cumulativePercent
    const endPct = cumulativePercent + item.percentage / 100
    cumulativePercent = endPct

    if (item.percentage === 100) {
      return (
        <g key={item.choice_id}>
          <circle cx={cx} cy={cy} r={outerR} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          <circle cx={cx} cy={cy} r={innerR} fill="white" />
        </g>
      )
    }

    const [sx, sy] = polarToCartesian(startPct, outerR)
    const [ex, ey] = polarToCartesian(endPct, outerR)
    const [iEx, iEy] = polarToCartesian(endPct, innerR)
    const [iSx, iSy] = polarToCartesian(startPct, innerR)
    const large = item.percentage > 50 ? 1 : 0

    const d = [
      `M ${sx} ${sy}`,
      `A ${outerR} ${outerR} 0 ${large} 1 ${ex} ${ey}`,
      `L ${iEx} ${iEy}`,
      `A ${innerR} ${innerR} 0 ${large} 0 ${iSx} ${iSy}`,
      'Z',
    ].join(' ')

    return (
      <path
        key={item.choice_id}
        d={d}
        fill={CHART_COLORS[i % CHART_COLORS.length]}
        style={{ transition: 'd 0.9s ease, fill 0.3s ease', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.10))' }}
      />
    )
  })

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={outerR} fill="#f1f5f9" />
        {segments}
        {results.every(r => r.percentage !== 100) && (
          <circle cx={cx} cy={cy} r={innerR} fill="white" />
        )}
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>
        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{totalVotes}</span>
        <span style={{ fontSize: '0.55rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: '2px' }}>votes</span>
      </div>
    </div>
  )
}

function PollCard({ poll, userId, onCopy }: { poll: Poll; userId: string; onCopy: (id: string) => void }) {
  const [results, setResults] = useState<Choice[]>([])
  const [totalVotes, setTotalVotes] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [loadingResults, setLoadingResults] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting)
    }, { threshold: 0.05 })
    
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const token = localStorage.getItem("auth_token")
    const controller = new AbortController()

    const fetchInitialData = async () => {
      try {
        const data = await api.get<any>(`/polls/${poll.id}`)
        const initialTotal = data.choices.reduce((acc: number, c: any) => acc + (c.vote_count || 0), 0)
        const mappedResults = data.choices.map((c: any) => ({
          choice_id: c.id,
          text: c.option_text,
          votes: c.vote_count,
          percentage: initialTotal === 0 ? 0 : Math.round((c.vote_count / initialTotal) * 100)
        }))
        setResults(mappedResults)
        setTotalVotes(initialTotal)
        setLoadingResults(false)
      } catch (err) {
        console.error("Initial fetch error:", err)
        setLoadingResults(false)
      }
    }

    const connectStream = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/polls/${poll.id}/stream`,
          { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal }
        )
        if (!res.ok) return
        const reader = res.body?.getReader()
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
                setLoadingResults(false)
              } catch {}
            }
          }
        }
      } catch (err: any) {
        if (err.name !== "AbortError") console.error("Stream error:", err)
      }
    }

    fetchInitialData()
    connectStream()
    
    return () => controller.abort()
  }, [poll.id, isVisible])

  const isClosed =
    poll.status === "closed" ||
    (poll.closes_at && new Date(poll.closes_at.replace(" ", "T") + "Z") < new Date())

  return (
    <div ref={cardRef} className="glass-card p-10 flex flex-col justify-between" style={{ 
      transition: 'transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease',
      border: isVisible ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(226, 232, 240, 0.4)'
    }}>
      <div>
        <div className="flex justify-between items-start gap-6 mb-5">
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', margin: 0, lineHeight: 1.2 }}>{poll.title}</h3>
          <span style={{
            fontSize: '0.65rem',
            fontWeight: 900,
            padding: '4px 10px',
            borderRadius: '8px',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: isClosed ? 'linear-gradient(135deg, #f1f5f9, #e2e8f0)' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            color: isClosed ? '#475569' : '#059669',
            border: `1px solid ${isClosed ? '#cbd5e1' : '#a7f3d0'}`,
            boxShadow: isClosed ? '0 2px 4px rgba(0,0,0,0.05)' : '0 4px 12px rgba(16,185,129,0.15)',
            flexShrink: 0
          }}>
            {isClosed ? '🔒 Closed' : '📡 Active'}
          </span>
        </div>
        <p style={{ fontSize: '0.95rem', color: '#64748b', lineHeight: 1.6, marginBottom: '32px' }} className="line-clamp-3">
          {poll.about || "No description provided."}
        </p>
 
        <div style={{ 
          marginBottom: '32px', 
          background: 'rgba(248, 250, 252, 0.8)', 
          borderRadius: '20px', 
          padding: '24px', 
          border: '1px solid #e2e8f0',
          minHeight: '180px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {loadingResults && results.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full opacity-50"></div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.05em' }}>SECURE SYNC...</span>
            </div>
          ) : results.length === 0 ? (
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic', textAlign: 'center', padding: '10px 0' }}>
              No votes yet — be the first!
            </p>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isClosed ? '0' : '18px' }}>
                {!isClosed && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></span>
                    Live Data
                  </span>
                )}
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isClosed ? '#64748b' : '#334155', marginLeft: isClosed ? '0' : 'auto' }}>
                  {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                <PollPieChart results={results} totalVotes={totalVotes} />
                <div style={{ flex: 1, display: 'grid', gap: '10px', minWidth: 0 }}>
                  {(() => {
                    const maxVotes = Math.max(...results.map(x => x.votes), 0)
                    const topOptionsCount = results.filter(x => x.votes === maxVotes && maxVotes > 0).length
                    
                    return results.map((r, i) => {
                      const color = CHART_COLORS[i % CHART_COLORS.length]
                      const isTop = r.votes === maxVotes && r.votes > 0
                      const tagLabel = topOptionsCount > 1 ? "Tie" : "Leading"
                      return (
                        <div key={r.choice_id}>
                          <div style={{ display: 'flex', alignItems: 'center', padding: '6px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexShrink: 0, width: '45%' }}>
                              <span style={{
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: color, flexShrink: 0,
                                boxShadow: `0 0 0 2px ${color}30`
                              }} />
                              <span style={{
                                fontSize: '0.82rem', fontWeight: 600, color: '#334155',
                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {r.text}
                              </span>
                              {isTop && (
                                <span style={{
                                  fontSize: '0.55rem', fontWeight: 800, color: color,
                                  background: `${color}15`, border: `1px solid ${color}30`,
                                  borderRadius: '4px', padding: '1px 5px',
                                  textTransform: 'uppercase', letterSpacing: '0.05em', flexShrink: 0
                                }}>
                                  {tagLabel}
                                </span>
                              )}
                            </div>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color, flexShrink: 0, marginLeft: '8px', width: '36px', textAlign: 'right' }}>
                              {r.percentage}%
                            </span>
                            <div style={{ 
                              flex: 1, 
                              height: '22px', 
                              borderLeft: '2px solid #cbd5e1', 
                              borderBottom: '2px solid #cbd5e1', 
                              marginLeft: '14px',
                              display: 'flex', 
                              alignItems: 'flex-end', 
                              paddingBottom: '2px'
                            }}>
                               <div style={{
                                 height: '10px',
                                 width: `${r.percentage}%`,
                                 background: `linear-gradient(90deg, ${color}cc, ${color})`,
                                 borderRadius: '0 3px 3px 0',
                                 transition: 'width 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                                 minWidth: r.percentage > 0 ? '4px' : '0'
                               }} />
                            </div>
                          </div>
                        </div>
                      )
                    })
                  })()}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-4">
        <div className="flex gap-2">
          {!isClosed && (
            <Link href={`/poll/${poll.id}`} className="flex-1">
              <button style={{ 
                width: '100%', 
                fontSize: '0.875rem', 
                padding: '10px 14px', 
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)', 
                color: 'white', 
                boxShadow: '0 4px 12px rgba(99,102,241,0.2)', 
                fontWeight: 700,
                border: 'none',
                borderRadius: '12px'
              }}>
                Cast Your Vote
              </button>
            </Link>
          )}
          {userId === poll.created_by && !isClosed && totalVotes === 0 && (
            <Link href={`/poll/${poll.id}/edit`} className="flex-1">
              <button style={{ 
                width: '100%', 
                fontSize: '0.875rem', 
                padding: '10px 14px', 
                background: '#ecfdf5', 
                color: '#065f46', 
                boxShadow: 'none', 
                fontWeight: 700,
                border: '1px solid #d1fae5',
                borderRadius: '12px'
              }}>
                Edit
              </button>
            </Link>
          )}
          {isClosed && (
             <Link href={`/results/${poll.id}`} className="flex-1">
             <button style={{ 
               width: '100%', 
               fontSize: '0.875rem', 
               padding: '10px 14px', 
               background: '#f8fafc', 
               color: '#475569', 
               boxShadow: 'none', 
               fontWeight: 700,
               border: '1px solid #e2e8f0',
               borderRadius: '12px'
             }}>
               View Final Results
             </button>
           </Link>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
          <button
            onClick={() => onCopy(poll.id)}
            style={{ fontSize: '0.825rem', padding: '7px 18px', background: '#f1f5f9', color: '#475569', boxShadow: 'none', fontWeight: 600, width: 'fit-content' }}
          >
            🔗 Copy Share Link
          </button>
        </div>
        <p className="text-[10px] text-center text-slate-400 mt-1 italic">
          Please share with your team members only
        </p>
      </div>
    </div>
  )
}

export default function TeamPollsPage() {
  const params = useParams()
  const teamId = params.id as string
  const { user, loading } = useAuth()
  const [polls, setPolls] = useState<Poll[]>([])
  const [fetching, setFetching] = useState(true)

  useEffect(() => {
    if (user && teamId) {
      api.get<Poll[]>(`/teams/${teamId}/polls`)
        .then(setPolls)
        .catch(console.error)
        .finally(() => setFetching(false))
    }
  }, [user, teamId])

  if (loading) return null
  if (!user) return <div className="container py-20 text-center">Please login.</div>

  const copyLink = (pollId: string) => {
    const link = `${window.location.origin}/poll/${pollId}`
    navigator.clipboard.writeText(link)
    alert("Shareable link copied to clipboard!")
  }

  return (
    <div className="min-h-screen animate-fade-in" style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', padding: '48px 24px' }}>
      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', opacity: 0.1, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: '500px', height: '500px', background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', opacity: 0.08, pointerEvents: 'none' }} />

      <div className="container max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <Link href="/teams" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#6366f1', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back to teams list
            </Link>
            <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.05em', margin: 0, lineHeight: 1 }}>Team Polls</h1>
            <p style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 500, marginTop: '12px' }}>Track engagements and real-time decisions across your workforce.</p>
          </div>
          <Link href={`/teams/${teamId}/create-poll`}>
            <button style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              fontWeight: 800,
              fontSize: '1rem',
              padding: '14px 28px',
              borderRadius: '16px',
              border: 'none',
              boxShadow: '0 10px 20px -5px rgba(99,102,241,0.3)',
              cursor: 'pointer'
            }}>
              Create New Poll
            </button>
          </Link>
        </div>

        <div className="flex flex-col gap-10 max-w-4xl mx-auto w-full">
          {fetching ? (
            <div className="py-20 text-center bg-white/30 backdrop-blur-sm rounded-[32px] border border-slate-200">
              <div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p style={{ fontWeight: 600, color: '#64748b' }}>Syncing team data...</p>
            </div>
          ) : polls.length === 0 ? (
            <div className="border-2 border-dashed border-slate-200 rounded-[32px] py-32 text-center bg-white/50 backdrop-blur-md">
              <div className="mb-6 mx-auto bg-slate-100 w-20 h-20 flex items-center justify-center rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b' }}>No active polls yet</h2>
              <p style={{ color: '#64748b', maxWidth: '300px', marginLeft: 'auto', marginRight: 'auto', marginTop: '8px' }}>Start a conversation by creating your team's first interactive poll.</p>
            </div>
          ) : (
            polls.map(poll => (
              <PollCard key={poll.id} poll={poll} userId={user.id as string} onCopy={copyLink} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
