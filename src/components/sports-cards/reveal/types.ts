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
  onComplete: () => void;
  onClose: () => void;
}

export type RevealPhase = 'intro' | 'countdown' | 'revealing' | 'complete';
