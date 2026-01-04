export type Player = {
  id: string;
  name: string;
  score: number;
  streak: number;
  isHost: boolean;
  sound?: { music?: boolean; sfx?: boolean };
};

export type Question = {
  name: string;
  id: number;
  difficulty: number; // 1,2,3
  category?: string;
};

export type RoomState = {
  code: string;
  players: Player[];
  hostId?: string;
  maxPlayers: number;
  status: 'lobby' | 'in-progress' | 'finished';
  round: number;
  totalRounds: number;
  roundEndsAt?: number;
  currentQuestion?: Question;
};
