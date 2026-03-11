import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState, resetGame } from "@/lib/gameState";
import { getPusher, CHANNEL, EVENTS } from "@/lib/pusherServer";
import { ADMIN_CODE, QUESTIONS } from "@/lib/questions";

export async function POST(req: NextRequest) {
  const { code, action, questionId } = await req.json();

  if (code !== ADMIN_CODE) {
    return NextResponse.json({ error: "Invalid admin code" }, { status: 401 });
  }

  const pusher = getPusher();
  const state = getGameState();

  if (action === "reveal") {
    const question = QUESTIONS.find((q) => q.id === questionId);
    if (!question) return NextResponse.json({ error: "Not found" }, { status: 404 });

    setGameState({ answerRevealed: true });
    await pusher.trigger(CHANNEL, EVENTS.ANSWER_REVEALED, {
      questionId,
      correctIndex: question.answer,
      correctText: question.options[question.answer],
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "finish") {
    setGameState({ status: "finished" });
    const leaderboard = Object.values(getGameState().players)
      .sort((a, b) => b.score - a.score)
      .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));

    await pusher.trigger(CHANNEL, EVENTS.GAME_FINISHED, { leaderboard });
    return NextResponse.json({ ok: true, leaderboard });
  }

  if (action === "reset") {
    resetGame();
    await pusher.trigger(CHANNEL, "game-reset", {});
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
