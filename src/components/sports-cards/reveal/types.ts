import { SportsCardData } from '../types';

export interface RevealCard extends SportsCardData {
  revealOrder: number;
  revealCategory: 'head_coach' | 'captain' | 'starter' | 'roster';
}

export interface PackRevealProps {
  cards: RevealCard[];
  teamName: string;
  sportName: string;
  seasonLabel: string;
  schoolLogo?: string | null;
  autoAdvance?: boolean; // Pack mode: auto-advances after delay (default true)
  autoAdvanceDelay?: number; // Delay per card in ms (default 3500)
  onComplete: () => void;
  onClose: () => void;
}

export type RevealPhase = 'intro' | 'countdown' | 'revealing' | 'complete';
