import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState } from "@/lib/gameState";
import { getPusher, CHANNEL, EVENTS } from "@/lib/pusherServer";
import { GAME_CODE } from "@/lib/questions";

export async function POST(req: NextRequest) {
  const { name, code } = await req.json();

  if (code !== GAME_CODE) {
    return NextResponse.json({ error: "Invalid game code" }, { status: 401 });
  }

  if (!name || name.trim().length < 1) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const state = getGameState();

  if (state.status !== "waiting") {
    return NextResponse.json({ error: "Game already started" }, { status: 400 });
  }

  const id = `p_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const player = {
    id,
    name: name.trim().slice(0, 20),
    score: 0,
    answers: [],
    joinedAt: Date.now(),
  };

  setGameState({
    players: { ...state.players, [id]: player },
  });

  const pusher = getPusher();
  await pusher.trigger(CHANNEL, EVENTS.PLAYER_JOINED, {
    player: { id: player.id, name: player.name },
    playerCount: Object.keys(getGameState().players).length,
  });

  return NextResponse.json({ playerId: id, name: player.name });
}
