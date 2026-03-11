"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import { QUESTIONS, QUIZ_DURATION_SECONDS } from "@/lib/questions";

type Screen = "join" | "lobby" | "quiz" | "results";

const TOPIC_COLORS: Record<string, { bg: string; text: string }> = {
  "Market Timings & Basics": { bg: "rgba(91,45,142,0.3)", text: "#C4A8FF" },
  "Taxation & Charges":      { bg: "rgba(217,119,6,0.3)",  text: "#FCD34D" },
  "Order Types":             { bg: "rgba(27,138,90,0.3)",  text: "#6EE7B7" },
  "Risk & Margin":           { bg: "rgba(220,38,38,0.3)",  text: "#FCA5A5" },
};

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function PlayerPage() {
  const [screen, setScreen] = useState<Screen>("join");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [playerCount, setPlayerCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Quiz state
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [feedback, setFeedback] = useState<{ correct: boolean; points: number } | null>(null);
  const [revealedAnswer, setRevealedAnswer] = useState<{ questionId: number; correctIndex: number } | null>(null);
  const [score, setScore] = useState(0);

  // Results
  const [leaderboard, setLeaderboard] = useState<{ rank: number; name: string; score: number }[]>([]);

  const pusherRef = useRef<Pusher | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback((start: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, QUIZ_DURATION_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) {
        clearInterval(timerRef.current!);
        setScreen("results");
      }
    }, 250);
  }, []);

  useEffect(() => {
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    pusherRef.current = pusher;
    const channel = pusher.subscribe("warroom-quiz");

    channel.bind("player-joined", (data: { playerCount: number }) => {
      setPlayerCount(data.playerCount);
    });

    channel.bind("game-started", (data: { startedAt: number; duration: number }) => {
      setStartedAt(data.startedAt);
      setScreen("quiz");
      startTimer(data.startedAt);
    });

    channel.bind("answer-revealed", (data: { questionId: number; correctIndex: number }) => {
      setRevealedAnswer(data);
    });

    channel.bind("game-finished", (data: { leaderboard: typeof leaderboard }) => {
      setLeaderboard(data.leaderboard);
      if (timerRef.current) clearInterval(timerRef.current);
      setScreen("results");
    });

    channel.bind("game-reset", () => {
      setScreen("join");
      setAnswers({});
      setScore(0);
      setCurrentQIndex(0);
      setFeedback(null);
      setRevealedAnswer(null);
    });

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      pusher.disconnect();
    };
  }, [startTimer]);

  async function handleJoin() {
    if (!name.trim() || !code.trim()) { setError("Enter your name and game code"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to join"); setLoading(false); return; }
      setPlayerId(data.playerId);
      // Get current player count
      const stateRes = await fetch("/api/game/state");
      const stateData = await stateRes.json();
      setPlayerCount(stateData.playerCount);
      setScreen("lobby");
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  }

  async function handleAnswer(questionId: number, answerIndex: number) {
    if (answers[questionId] !== undefined) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answerIndex }));
    try {
      const res = await fetch("/api/game/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, questionId, answerIndex }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ correct: data.correct, points: data.points });
        setScore(data.score);
        setTimeout(() => {
          setFeedback(null);
          if (currentQIndex < QUESTIONS.length - 1) setCurrentQIndex((i) => i + 1);
        }, 1200);
      }
    } catch { /* silent */ }
  }

  const timerPct = (timeLeft / QUIZ_DURATION_SECONDS) * 100;
  const urgent = timeLeft < 20;
  const q = QUESTIONS[currentQIndex];
  const topicStyle = TOPIC_COLORS[q?.topic] || { bg: "rgba(255,255,255,0.1)", text: "#fff" };

  // ── JOIN SCREEN ──
  if (screen === "join") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3E 100%)" }}>
      <div style={{ width: "100%", maxWidth: 400 }} className="animate-fade-up">
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 13, fontFamily: "Syne", fontWeight: 700, letterSpacing: "0.15em", color: "var(--purple-mid)", textTransform: "uppercase", marginBottom: 8 }}>Upstox War Room</div>
          <h1 style={{ fontFamily: "Syne", fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>The Quiz</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 8, fontSize: 14 }}>8 Questions · 90 Seconds · One Winner</p>
        </div>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={20} onKeyDown={(e) => e.key === "Enter" && handleJoin()} autoFocus />
          <input className="input-field" placeholder="Game code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={10} onKeyDown={(e) => e.key === "Enter" && handleJoin()} inputMode="numeric" />
          {error && <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="btn-primary" onClick={handleJoin} disabled={loading} style={{ marginTop: 4 }}>
            {loading ? "Joining..." : "Join Game →"}
          </button>
        </div>
        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 16 }}>Get the game code from your host</p>
      </div>
    </div>
  );

  // ── LOBBY SCREEN ──
  if (screen === "lobby") return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px", textAlign: "center", background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3E 100%)" }}>
      <div className="animate-fade-up" style={{ maxWidth: 400, width: "100%" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", fontSize: 32 }}>⚔️</div>
        <h2 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, margin: "0 0 8px" }}>You're in!</h2>
        <p style={{ color: "rgba(255,255,255,0.5)", margin: "0 0 32px", fontSize: 15 }}>Waiting for the host to start...</p>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Playing as</div>
          <div style={{ fontFamily: "Syne", fontSize: 22, fontWeight: 700 }}>{name}</div>
          <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.07)", margin: "16px 0" }} />
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Players joined</div>
          <div style={{ fontFamily: "Syne", fontSize: 32, fontWeight: 800, color: "var(--purple-mid)" }}>{playerCount}</div>
        </div>
        <div style={{ marginTop: 24, display: "flex", gap: 8, justifyContent: "center" }}>
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--purple-mid)", opacity: 0.6, animation: `pulse-ring 1.2s ease-in-out ${i * 0.3}s infinite` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // ── RESULTS SCREEN ──
  if (screen === "results") return (
    <div style={{ minHeight: "100dvh", padding: "24px 16px", background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3E 100%)", overflowY: "auto" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }} className="animate-fade-up">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🏆</div>
          <h1 style={{ fontFamily: "Syne", fontSize: 30, fontWeight: 800, margin: "0 0 4px" }}>Quiz Over!</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, margin: 0 }}>Your score: <strong style={{ color: "var(--purple-mid)", fontFamily: "Syne", fontSize: 18 }}>{score}</strong></p>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontFamily: "Syne", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", marginBottom: 16 }}>Leaderboard</div>
          {leaderboard.length === 0 && <p style={{ color: "rgba(255,255,255,0.3)", textAlign: "center", fontSize: 14 }}>Waiting for final results...</p>}
          {leaderboard.map((p, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "#D97706" : i === 1 ? "#9CA3AF" : i === 2 ? "#92400E" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 14, flexShrink: 0 }}>
                {i < 3 ? ["🥇","🥈","🥉"][i] : p.rank}
              </div>
              <div style={{ flex: 1, fontWeight: p.name === name ? 700 : 400, color: p.name === name ? "var(--purple-mid)" : "white" }}>{p.name}{p.name === name ? " (you)" : ""}</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 16 }}>{p.score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── QUIZ SCREEN ──
  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "linear-gradient(160deg, #0F0A1E 0%, #1A0A3E 100%)" }}>
      {/* Header */}
      <div style={{ padding: "16px 16px 0", position: "sticky", top: 0, zIndex: 10, background: "linear-gradient(to bottom, #0F0A1E, transparent)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ fontFamily: "Syne", fontSize: 13, color: "rgba(255,255,255,0.4)", fontWeight: 600 }}>Q{currentQIndex + 1} / {QUESTIONS.length}</div>
          <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: urgent ? "#FCA5A5" : "white" }}>{Math.ceil(timeLeft)}s</div>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 14, color: "var(--purple-mid)" }}>{score} pts</div>
        </div>
        <div className="timer-bar">
          <div className={`timer-fill${urgent ? " urgent" : ""}`} style={{ width: `${timerPct}%` }} />
        </div>
      </div>

      {/* Question */}
      <div style={{ flex: 1, padding: "20px 16px 24px", display: "flex", flexDirection: "column", gap: 16, overflowY: "auto" }}>
        <div key={currentQIndex} className="animate-fade-up card" style={{ padding: 20 }}>
          <span className="topic-badge" style={{ background: topicStyle.bg, color: topicStyle.text, marginBottom: 12, display: "inline-block" }}>
            {q.topic}
          </span>
          <p style={{ margin: 0, fontSize: 17, fontWeight: 600, lineHeight: 1.5, fontFamily: "Syne" }}>{q.question}</p>
        </div>

        {/* Options */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            const selected = answers[q.id] === i;
            const isRevealedCorrect = revealedAnswer?.questionId === q.id && revealedAnswer.correctIndex === i;
            const isRevealedWrong = revealedAnswer?.questionId === q.id && selected && !isRevealedCorrect;
            let cls = "option-btn";
            if (isRevealedCorrect) cls += " correct";
            else if (isRevealedWrong) cls += " wrong";
            else if (selected) cls += " selected";

            return (
              <button key={i} className={cls} onClick={() => handleAnswer(q.id, i)} disabled={answers[q.id] !== undefined}>
                <span style={{ width: 28, height: 28, borderRadius: "50%", background: selected ? "var(--purple)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
                  {OPTION_LABELS[i]}
                </span>
                <span style={{ lineHeight: 1.4 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Feedback toast */}
        {feedback && (
          <div className="animate-pop card" style={{ padding: "14px 20px", textAlign: "center", background: feedback.correct ? "rgba(27,138,90,0.3)" : "rgba(220,38,38,0.2)", border: `1px solid ${feedback.correct ? "var(--green)" : "var(--red)"}` }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{feedback.correct ? "✓" : "✗"}</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 15 }}>{feedback.correct ? `+${feedback.points} points!` : "Not quite"}</div>
          </div>
        )}

        {/* Already answered all questions */}
        {currentQIndex === QUESTIONS.length - 1 && answers[q.id] !== undefined && !feedback && (
          <div className="card" style={{ padding: 20, textAlign: "center" }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
            <div style={{ fontFamily: "Syne", fontWeight: 700 }}>All done!</div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 4 }}>Waiting for time to end...</div>
          </div>
        )}
      </div>
    </div>
  );
}
