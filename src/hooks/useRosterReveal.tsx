import { useState, useCallback } from 'react';
import { RevealCard } from '@/components/sports-cards/reveal/types';
import { SportsCardData, CardBackgroundStyle } from '@/components/sports-cards/types';

interface UseRosterRevealOptions {
  teamId: string;
  seasonId: string;
}

interface RosterMember {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  jerseyNumber?: number | null;
  gradYear?: number | null;
  height?: string | null;
  weight?: string | null;
  role: 'athlete' | 'coach' | 'staff';
  roleTitle?: string;
  positions: Array<{
    id: string;
    position_key: string;
    display_name: string;
    is_primary?: boolean;
    depth_order?: number | null;
  }>;
  lineGroups: Array<{
    id: string;
    line_key: string;
    display_name: string;
    is_primary?: boolean;
  }>;
  badges: Array<{ key: string; label: string; icon?: string }>;
  isCaptain?: boolean;
  isStarter?: boolean;
}

export function useRosterReveal({ teamId, seasonId }: UseRosterRevealOptions) {
  const [isRevealing, setIsRevealing] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);

  const buildRevealCards = useCallback((
    members: RosterMember[],
    teamName: string,
    sportKey: string,
    sportName: string,
    seasonLabel: string,
    schoolName?: string,
    schoolLogo?: string | null,
    backgroundStyle: CardBackgroundStyle = 'classic'
  ): RevealCard[] => {
    let order = 0;

    // Sort: head coach first, then captains, then starters, then rest
    const sorted = [...members].sort((a, b) => {
      // Head coach first
      if (a.role === 'coach' && a.roleTitle?.toLowerCase().includes('head')) return -1;
      if (b.role === 'coach' && b.roleTitle?.toLowerCase().includes('head')) return 1;
      
      // Then other coaches
      if (a.role === 'coach' && b.role !== 'coach') return -1;
      if (b.role === 'coach' && a.role !== 'coach') return 1;
      
      // Then captains
      if (a.isCaptain && !b.isCaptain) return -1;
      if (b.isCaptain && !a.isCaptain) return 1;
      
      // Then starters
      if (a.isStarter && !b.isStarter) return -1;
      if (b.isStarter && !a.isStarter) return 1;
      
      // Then by jersey number
      if (a.jerseyNumber && b.jerseyNumber) return a.jerseyNumber - b.jerseyNumber;
      
      // Then alphabetically
      return a.lastName.localeCompare(b.lastName);
    });

    return sorted.map((member): RevealCard => {
      const category = 
        member.role === 'coach' && member.roleTitle?.toLowerCase().includes('head') 
          ? 'head_coach'
          : member.isCaptain 
            ? 'captain'
            : member.isStarter 
              ? 'starter'
              : 'roster';

      const cardData: SportsCardData = {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        photoUrl: member.photoUrl,
        teamName,
        sportKey,
        sportName,
        seasonLabel,
        jerseyNumber: member.jerseyNumber,
        positions: member.positions,
        lineGroups: member.lineGroups,
        gradYear: member.gradYear,
        height: member.height,
        weight: member.weight,
        role: member.role === 'athlete' ? 'player' : member.role === 'coach' ? 'coach' : 'staff',
        roleTitle: member.roleTitle,
        badges: member.badges,
        backgroundStyle,
        schoolName,
        schoolLogo,
      };

      return {
        ...cardData,
        revealOrder: order++,
        revealCategory: category,
      };
    });
  }, []);

  const startReveal = useCallback(() => {
    setIsRevealing(true);
  }, []);

  const completeReveal = useCallback(() => {
    setIsRevealing(false);
    setHasRevealed(true);
  }, []);

  const closeReveal = useCallback(() => {
    setIsRevealing(false);
  }, []);

  return {
    isRevealing,
    hasRevealed,
    startReveal,
    completeReveal,
    closeReveal,
    buildRevealCards,
  };
}
