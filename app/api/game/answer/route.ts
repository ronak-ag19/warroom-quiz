import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState } from "@/lib/gameState";
import { getPusher, CHANNEL, EVENTS } from "@/lib/pusherServer";
import { QUESTIONS, QUIZ_DURATION_SECONDS } from "@/lib/questions";

export async function POST(req: NextRequest) {
  const { playerId, questionId, answerIndex } = await req.json();

  const state = getGameState();
  if (state.status !== "active") {
    return NextResponse.json({ error: "Game not active" }, { status: 400 });
  }

  const player = state.players[playerId];
  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // Check time remaining
  const elapsed = (Date.now() - (state.startedAt || 0)) / 1000;
  if (elapsed > QUIZ_DURATION_SECONDS) {
    return NextResponse.json({ error: "Time is up" }, { status: 400 });
  }

  // Don't allow duplicate answers for same question
  if (player.answers.find((a) => a.questionId === questionId)) {
    return NextResponse.json({ error: "Already answered" }, { status: 400 });
  }

  const question = QUESTIONS.find((q) => q.id === questionId);
  if (!question) {
    return NextResponse.json({ error: "Question not found" }, { status: 404 });
  }

  const correct = answerIndex === question.answer;
  // Score: base 100 pts if correct, bonus for speed (up to 50 pts)
  const timeMs = Date.now() - (state.startedAt || 0);
  const speedBonus = correct ? Math.max(0, Math.floor(50 * (1 - elapsed / QUIZ_DURATION_SECONDS))) : 0;
  const points = correct ? 100 + speedBonus : 0;

  const updatedPlayer = {
    ...player,
    score: player.score + points,
    answers: [...player.answers, { questionId, answerIndex, correct, timeMs }],
  };

  setGameState({
    players: { ...state.players, [playerId]: updatedPlayer },
  });

  // Check if all players answered all questions — auto-finish
  const updatedState = getGameState();
  const allAnswered = Object.values(updatedState.players).every(
    (p) => p.answers.length >= QUESTIONS.length
  );
  if (allAnswered) {
    setGameState({ status: "finished" });
    const pusher = getPusher();
    await pusher.trigger(CHANNEL, EVENTS.GAME_FINISHED, {
      leaderboard: buildLeaderboard(updatedState),
    });
  }

  return NextResponse.json({ correct, points, score: updatedPlayer.score });
}

function buildLeaderboard(state: ReturnType<typeof getGameState>) {
  return Object.values(state.players)
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({ rank: i + 1, name: p.name, score: p.score }));
}
