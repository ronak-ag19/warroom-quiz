// In-memory store for game state (persists across API calls in the same serverless instance)
// For production with multiple instances, use Vercel KV or Upstash Redis

export type Player = {
  id: string;
  name: string;
  score: number;
  answers: { questionId: number; answerIndex: number; correct: boolean; timeMs: number }[];
  joinedAt: number;
};

export type GameState = {
  status: "waiting" | "active" | "finished";
  players: Record<string, Player>;
  startedAt: number | null;
  currentQuestion: number;
  answerRevealed: boolean;
};

const defaultState = (): GameState => ({
  status: "waiting",
  players: {},
  startedAt: null,
  currentQuestion: 0,
  answerRevealed: false,
});

// Use global to persist across hot reloads in dev
declare global {
  var __gameState: GameState | undefined;
}

export function getGameState(): GameState {
  if (!global.__gameState) {
    global.__gameState = defaultState();
  }
  return global.__gameState;
}

export function setGameState(state: Partial<GameState>) {
  if (!global.__gameState) global.__gameState = defaultState();
  global.__gameState = { ...global.__gameState, ...state };
}

export function resetGame() {
  global.__gameState = defaultState();
}
