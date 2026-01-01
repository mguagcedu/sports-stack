export type CardBackgroundStyle = 'classic' | 'neon' | 'chrome' | 'matte' | 'heritage';
export type CardRenderVariant = 'player' | 'coach' | 'staff';

export interface Position {
  id: string;
  position_key: string;
  display_name: string;
  is_primary?: boolean;
  depth_order?: number | null;
}

export interface LineGroup {
  id: string;
  line_key: string;
  display_name: string;
  is_primary?: boolean;
}

export interface Badge {
  key: string;
  label: string;
  icon?: string;
}

export interface SportsCardData {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
  teamName: string;
  sportKey: string;
  sportName: string;
  seasonLabel: string;
  jerseyNumber?: number | null;
  positions: Position[];
  lineGroups: LineGroup[];
  gradYear?: number | null;
  height?: string | null;
  weight?: string | null;
  role: CardRenderVariant;
  roleTitle?: string;
  badges: Badge[];
  ratingOverall?: number | null;
  showRating?: boolean;
  accentColor?: string | null;
  backgroundStyle: CardBackgroundStyle;
  schoolName?: string;
  schoolLogo?: string | null;
}

export interface SportsCardProps {
  data: SportsCardData;
  size?: 'mini' | 'small' | 'medium' | 'large';
  onClick?: () => void;
  className?: string;
  showDetails?: boolean;
}
