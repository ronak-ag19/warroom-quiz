import Pusher from "pusher";

let pusherInstance: Pusher | null = null;

export function getPusher(): Pusher {
  if (!pusherInstance) {
    pusherInstance = new Pusher({
      appId: process.env.PUSHER_APP_ID!,
      key: process.env.PUSHER_KEY!,
      secret: process.env.PUSHER_SECRET!,
      cluster: process.env.PUSHER_CLUSTER!,
      useTLS: true,
    });
  }
  return pusherInstance;
}

export const CHANNEL = "warroom-quiz";
export const EVENTS = {
  PLAYER_JOINED: "player-joined",
  GAME_STARTED: "game-started",
  ANSWER_SUBMITTED: "answer-submitted",
  ANSWER_REVEALED: "answer-revealed",
  GAME_FINISHED: "game-finished",
  STATE_UPDATE: "state-update",
};
