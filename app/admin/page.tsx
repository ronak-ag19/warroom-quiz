"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Pusher from "pusher-js";
import { QUESTIONS, ADMIN_CODE, QUIZ_DURATION_SECONDS } from "@/lib/questions";

type LeaderboardEntry = { rank: number; name: string; score: number };

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");

  const [status, setStatus] = useState<"waiting" | "active" | "finished">("waiting");
  const [playerCount, setPlayerCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUIZ_DURATION_SECONDS);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [revealedQ, setRevealedQ] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentRevealIndex, setCurrentRevealIndex] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startTimer = useCallback((start: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, QUIZ_DURATION_SECONDS - elapsed);
      setTimeLeft(left);
      if (left <= 0) { clearInterval(timerRef.current!); setStatus("finished"); }
    }, 250);
  }, []);

  useEffect(() => {
    if (!authed) return;
    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe("warroom-quiz");

    channel.bind("player-joined", (data: { playerCount: number }) => {
      setPlayerCount(data.playerCount);
    });
    channel.bind("game-started", (data: { startedAt: number }) => {
      setStartedAt(data.startedAt);
      setStatus("active");
      startTimer(data.startedAt);
    });
    channel.bind("game-finished", (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setStatus("finished");
      if (timerRef.current) clearInterval(timerRef.current);
    });
    channel.bind("game-reset", () => {
      setStatus("waiting");
      setPlayerCount(0);
      setLeaderboard([]);
      setRevealedQ(null);
      setTimeLeft(QUIZ_DURATION_SECONDS);
    });

    // Poll for state
    fetch("/api/game/state").then((r) => r.json()).then((d) => {
      setPlayerCount(d.playerCount);
      setStatus(d.status);
      setLeaderboard(d.leaderboard);
      if (d.status === "active" && d.startedAt) { setStartedAt(d.startedAt); startTimer(d.startedAt); }
    });

    return () => { if (timerRef.current) clearInterval(timerRef.current); pusher.disconnect(); };
  }, [authed, startTimer]);

  async function adminAction(action: string, extra?: object) {
    setLoading(true);
    const res = await fetch("/api/game/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ADMIN_CODE, action, ...extra }),
    });
    const data = await res.json();
    if (action === "finish" && data.leaderboard) setLeaderboard(data.leaderboard);
    setLoading(false);
  }

  async function handleStart() {
    const res = await fetch("/api/game/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: ADMIN_CODE }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); }
  }

  function handleReveal(questionId: number) {
    setRevealedQ(questionId);
    adminAction("reveal", { questionId });
  }

  const timerPct = (timeLeft / QUIZ_DURATION_SECONDS) * 100;
  const urgent = timeLeft < 20;

  if (!authed) return (
    <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "linear-gradient(160deg, #0F0A1E, #1A0A3E)" }}>
      <div style={{ maxWidth: 360, width: "100%" }} className="animate-fade-up">
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
          <h1 style={{ fontFamily: "Syne", fontSize: 28, fontWeight: 800, margin: 0 }}>Admin Panel</h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginTop: 8 }}>The War Room Quiz</p>
        </div>
        <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 12 }}>
          <input className="input-field" type="password" placeholder="Admin code" value={codeInput}
            onChange={(e) => setCodeInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { if (codeInput === ADMIN_CODE) setAuthed(true); else setError("Wrong code"); } }}
          />
          {error && <p style={{ color: "#FCA5A5", fontSize: 13, margin: 0 }}>{error}</p>}
          <button className="btn-primary" onClick={() => { if (codeInput === ADMIN_CODE) { setAuthed(true); setError(""); } else setError("Wrong code"); }}>
            Enter
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg, #0F0A1E, #1A0A3E)", padding: "0 0 40px" }}>
      {/* Sticky header */}
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "#0F0A1E", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 16 }}>War Room Admin</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, background: status === "waiting" ? "rgba(217,119,6,0.3)" : status === "active" ? "rgba(27,138,90,0.3)" : "rgba(91,45,142,0.3)", color: status === "waiting" ? "#FCD34D" : status === "active" ? "#6EE7B7" : "#C4A8FF", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              {status}
            </span>
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{playerCount} players</span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Game code */}
        <div className="card" style={{ padding: 20, textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8 }}>Game Code</div>
          <div style={{ fontFamily: "Syne", fontSize: 48, fontWeight: 800, letterSpacing: "0.15em", color: "var(--purple-mid)" }}>1947</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>Share with participants</div>
        </div>

        {/* Timer (when active) */}
        {status === "active" && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <span style={{ fontFamily: "Syne", fontWeight: 700 }}>Time Remaining</span>
              <span style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 22, color: urgent ? "#FCA5A5" : "white" }}>{Math.ceil(timeLeft)}s</span>
            </div>
            <div className="timer-bar">
              <div className={`timer-fill${urgent ? " urgent" : ""}`} style={{ width: `${timerPct}%` }} />
            </div>
          </div>
        )}

        {/* Controls */}
        {status === "waiting" && (
          <button className="btn-primary" onClick={handleStart} disabled={loading || playerCount === 0} style={{ fontSize: 18, padding: 18 }}>
            {playerCount === 0 ? "Waiting for players..." : `Start Quiz (${playerCount} player${playerCount !== 1 ? "s" : ""})`}
          </button>
        )}
        {status === "active" && (
          <button className="btn-amber" onClick={() => adminAction("finish")} disabled={loading}>
            End Quiz Now
          </button>
        )}
        {status === "finished" && (
          <button className="btn-primary" onClick={() => adminAction("reset")} disabled={loading} style={{ background: "rgba(255,255,255,0.1)" }}>
            Reset for New Game
          </button>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Leaderboard</div>
            {leaderboard.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < leaderboard.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: i === 0 ? "#D97706" : i === 1 ? "#6B7280" : i === 2 ? "#92400E" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 13, flexShrink: 0 }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : p.rank}
                </div>
                <div style={{ flex: 1, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontFamily: "Syne", fontWeight: 800, fontSize: 18, color: "var(--purple-mid)" }}>{p.score}</div>
              </div>
            ))}
          </div>
        )}

        {/* Reveal answers section */}
        {(status === "active" || status === "finished") && (
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 16 }}>Reveal Answers</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {QUESTIONS.map((q, i) => (
                <div key={q.id} className="card" style={{ padding: 14, background: revealedQ === q.id ? "rgba(27,138,90,0.15)" : "rgba(255,255,255,0.03)", border: revealedQ === q.id ? "1px solid var(--green)" : "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "var(--purple)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Syne", fontWeight: 800, fontSize: 11 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 6, lineHeight: 1.4 }}>{q.question.length > 80 ? q.question.slice(0, 80) + "..." : q.question}</div>
                      {revealedQ === q.id ? (
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#6EE7B7" }}>✓ {q.options[q.answer]}</div>
                      ) : (
                        <button onClick={() => handleReveal(q.id)} style={{ background: "var(--purple)", border: "none", color: "white", borderRadius: 8, padding: "6px 14px", fontSize: 12, fontFamily: "Syne", fontWeight: 700, cursor: "pointer" }}>
                          Reveal Answer
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && <p style={{ color: "#FCA5A5", textAlign: "center", fontSize: 13 }}>{error}</p>}
      </div>
    </div>
  );
}
