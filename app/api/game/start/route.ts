import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState } from "@/lib/gameState";
import { getPusher, CHANNEL, EVENTS } from "@/lib/pusherServer";
import { ADMIN_CODE, QUIZ_DURATION_SECONDS } from "@/lib/questions";

export async function POST(req: NextRequest) {
  const { code } = await req.json();

  if (code !== ADMIN_CODE) {
    return NextResponse.json({ error: "Invalid admin code" }, { status: 401 });
  }

  const state = getGameState();
  if (state.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 400 });
  }

  const startedAt = Date.now();
  setGameState({ status: "active", startedAt, currentQuestion: 0 });

  const pusher = getPusher();
  await pusher.trigger(CHANNEL, EVENTS.GAME_STARTED, {
    startedAt,
    duration: QUIZ_DURATION_SECONDS,
  });

  return NextResponse.json({ ok: true, startedAt, duration: QUIZ_DURATION_SECONDS });
}
