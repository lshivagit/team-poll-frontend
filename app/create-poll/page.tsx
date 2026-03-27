"use client"

import { useState } from "react"

export default function CreatePoll() {

  const [title, setTitle] = useState("")
  const [about, setAbout] = useState("")
  const [closesAt, setClosesAt] = useState("")
  const [choices, setChoices] = useState(["", ""])
  const [multipleChoice, setMultipleChoice] = useState(false)

  const addChoice = () => {
    setChoices([...choices, ""])
  }

  const updateChoice = (index: number, value: string) => {
    const updated = [...choices]
    updated[index] = value
    setChoices(updated)
  }

  const createPoll = async () => {

  const res = await fetch("http://localhost:3000/polls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      title,
      about,
      multiple_choice: multipleChoice,
      closes_at: closesAt ? closesAt + ":00" : null,
      choices: choices
    })
  })

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  const data = await res.json()

  alert("Poll Created!")

  window.location.href = `/poll/${data.poll_id}`
  }

  return (

    <div style={{padding:"40px", fontFamily:"Arial"}}>

      <h1>Create Poll</h1>

      <div style={{marginTop:"20px"}}>

        <input
          placeholder="Poll Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        <br/><br/>

        <input
          placeholder="Description"
          value={about}
          onChange={e => setAbout(e.target.value)}
        />

        <br/><br/>

        <label>Poll Closing Time</label>

        <br/>

        <input
          type="datetime-local"
          value={closesAt}
          onChange={e => setClosesAt(e.target.value)}
        />

        <br/><br/>

        <label>
          <input
            type="checkbox"
            checked={multipleChoice}
            onChange={e => setMultipleChoice(e.target.checked)}
          />
          Allow multiple choices
        </label>

        <br/><br/>

        <h3>Options</h3>

        {choices.map((choice, i) => (

          <div key={i}>

            <input
              placeholder={`Option ${i+1}`}
              value={choice}
              onChange={e => updateChoice(i, e.target.value)}
            />

          </div>

        ))}

        <br/>

        <button onClick={addChoice}>
          Add Option
        </button>

        <br/><br/>

        <button onClick={createPoll}>
          Create Poll
        </button>

      </div>

    </div>

  )
}