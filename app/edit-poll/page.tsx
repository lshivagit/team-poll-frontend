"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type PollOption = {
  id?: number;
  option_text: string;
};

type PollData = {
  id: string;
  title: string;
  about: string | null;
  multiple_choice: boolean;
  choices: PollOption[];
};

export default function EditPoll({ pollId }: { pollId: string }) {
  const router = useRouter();

  const [poll, setPoll] = useState<PollData | null>(null);
  const [title, setTitle] = useState("");
  const [about, setAbout] = useState("");
  const [multipleChoice, setMultipleChoice] = useState(false);
  const [choices, setChoices] = useState<PollOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // fetch poll details from backend
    fetch(`http://localhost:3000/polls/${pollId}`)
      .then((res) => res.json())
      .then((data) => {
        setPoll(data);
        setTitle(data.title);
        setAbout(data.about || "");
        setMultipleChoice(data.multiple_choice);
        setChoices(data.choices);
        setLoading(false);
      })
      .catch((err) => console.error(err));
  }, [pollId]);

  const addChoice = () => {
    setChoices([...choices, { option_text: "" }]);
  };

  const updateChoice = (index: number, value: string) => {
    const updated = [...choices];
    updated[index].option_text = value;
    setChoices(updated);
  };

  const removeChoice = (index: number) => {
    const updated = choices.filter((_, i) => i !== index);
    setChoices(updated);
  };

  const savePoll = async () => {
    const res = await fetch(`http://localhost:3000/polls/${pollId}/edit`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        about,
        multiple_choice: multipleChoice,
        choices: choices.map((c) => c.option_text).filter((c) => c.trim() !== ""),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      alert(`Error: ${text}`);
      return;
    }

    alert("Poll updated successfully!");
    router.push(`/poll/${pollId}`);
  };

  if (loading) return <p>Loading poll...</p>;

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>
      <h1>Edit Poll</h1>

      <div style={{ marginTop: "20px" }}>
        <input
          placeholder="Poll Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <br />
        <br />
        <input
          placeholder="Description"
          value={about}
          onChange={(e) => setAbout(e.target.value)}
        />
        <br />
        <br />
        <label>
          <input
            type="checkbox"
            checked={multipleChoice}
            onChange={(e) => setMultipleChoice(e.target.checked)}
          />
          Allow multiple choices
        </label>

        <br />
        <br />
        <h3>Options</h3>
        {choices.map((choice, i) => (
          <div key={i} style={{ display: "flex", marginBottom: "5px" }}>
            <input
              placeholder={`Option ${i + 1}`}
              value={choice.option_text}
              onChange={(e) => updateChoice(i, e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              style={{ marginLeft: "5px" }}
              onClick={() => removeChoice(i)}
            >
              X
            </button>
          </div>
        ))}

        <button onClick={addChoice}>Add Option</button>
        <br />
        <br />
        <button onClick={savePoll}>Save Changes</button>
      </div>
    </div>
  );
}