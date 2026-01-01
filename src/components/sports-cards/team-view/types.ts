import { SportsCardData } from '../types';

export interface LayoutSlot {
  key: string;
  label: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  positionKeys?: string[]; // positions that can fill this slot
}

export interface SportLayoutTemplate {
  id: string;
  sportKey: string;
  templateKey: string;
  displayName: string;
  templateType: 'formation' | 'court_map' | 'field_map' | 'lineup_grid' | 'pool_map' | 'lanes' | 'heats' | 'weight_classes' | 'relays' | 'bracket' | 'rotation' | 'grouped_list';
  side?: 'offense' | 'defense' | 'special_teams' | 'none';
  slots: LayoutSlot[];
  backgroundImage?: string;
  aspectRatio?: string; // e.g., "16/9", "4/3"
}

export interface TeamMemberForLayout {
  id: string;
  membershipId: string;
  cardData: SportsCardData;
  positions: string[];
  lineGroups: string[];
  isStarter: boolean;
  depthOrder?: number;
}

export interface SlotAssignment {
  slotKey: string;
  memberId: string;
}

export interface TeamViewState {
  selectedTemplateId: string | null;
  selectedLineGroupId: string | null;
  slotAssignments: SlotAssignment[];
  highlightedMemberId: string | null;
  filter: {
    lineGroup: string | null;
    positionGroup: string | null;
    startersOnly: boolean;
  };
}
