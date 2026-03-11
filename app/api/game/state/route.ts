import { NextResponse } from "next/server";
import { getGameState } from "@/lib/gameState";
import { QUESTIONS } from "@/lib/questions";

export async function GET() {
  const state = getGameState();
  const leaderboard = Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score, answers: p.answers.length }));

  return NextResponse.json({
    status: state.status,
    playerCount: Object.keys(state.players).length,
    startedAt: state.startedAt,
    leaderboard,
    totalQuestions: QUESTIONS.length,
  });
}
