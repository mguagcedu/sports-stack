import { SportLayoutTemplate, LayoutSlot } from './types';

// Football 11-man templates
const football11ManTemplates: SportLayoutTemplate[] = [
  {
    id: 'fb11-offense-i',
    sportKey: 'football_11_man',
    templateKey: 'i_formation',
    displayName: 'I Formation',
    templateType: 'formation',
    side: 'offense',
    aspectRatio: '16/10',
    slots: [
      { key: 'QB', label: 'QB', x: 50, y: 65, positionKeys: ['QB'] },
      { key: 'FB', label: 'FB', x: 50, y: 50, positionKeys: ['FB', 'RB'] },
      { key: 'RB', label: 'RB', x: 50, y: 35, positionKeys: ['RB', 'FB'] },
      { key: 'WR1', label: 'WR', x: 10, y: 75, positionKeys: ['WR'] },
      { key: 'WR2', label: 'WR', x: 90, y: 75, positionKeys: ['WR'] },
      { key: 'TE', label: 'TE', x: 75, y: 75, positionKeys: ['TE'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['LT', 'OL'] },
      { key: 'LG', label: 'LG', x: 40, y: 75, positionKeys: ['LG', 'OL'] },
      { key: 'C', label: 'C', x: 50, y: 75, positionKeys: ['C', 'OL'] },
      { key: 'RG', label: 'RG', x: 60, y: 75, positionKeys: ['RG', 'OL'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['RT', 'OL'] },
    ],
  },
  {
    id: 'fb11-defense-43',
    sportKey: 'football_11_man',
    templateKey: '4_3_defense',
    displayName: '4-3 Defense',
    templateType: 'formation',
    side: 'defense',
    aspectRatio: '16/10',
    slots: [
      { key: 'DE1', label: 'DE', x: 25, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'DT1', label: 'DT', x: 40, y: 75, positionKeys: ['DT', 'DL'] },
      { key: 'DT2', label: 'DT', x: 60, y: 75, positionKeys: ['DT', 'DL'] },
      { key: 'DE2', label: 'DE', x: 75, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'OLB1', label: 'OLB', x: 20, y: 55, positionKeys: ['OLB', 'LB'] },
      { key: 'MLB', label: 'MLB', x: 50, y: 55, positionKeys: ['MLB', 'LB'] },
      { key: 'OLB2', label: 'OLB', x: 80, y: 55, positionKeys: ['OLB', 'LB'] },
      { key: 'CB1', label: 'CB', x: 10, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'CB2', label: 'CB', x: 90, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'SS', label: 'SS', x: 35, y: 25, positionKeys: ['SS', 'S', 'DB'] },
      { key: 'FS', label: 'FS', x: 65, y: 25, positionKeys: ['FS', 'S', 'DB'] },
    ],
  },
];

// Basketball templates
const basketballTemplates: SportLayoutTemplate[] = [
  {
    id: 'bball-halfcourt',
    sportKey: 'basketball_boys',
    templateKey: 'halfcourt_5',
    displayName: 'Half Court',
    templateType: 'court_map',
    aspectRatio: '4/3',
    slots: [
      { key: 'PG', label: 'PG', x: 50, y: 85, positionKeys: ['PG', 'G'] },
      { key: 'SG', label: 'SG', x: 75, y: 70, positionKeys: ['SG', 'G'] },
      { key: 'SF', label: 'SF', x: 25, y: 70, positionKeys: ['SF', 'F'] },
      { key: 'PF', label: 'PF', x: 30, y: 45, positionKeys: ['PF', 'F'] },
      { key: 'C', label: 'C', x: 70, y: 45, positionKeys: ['C'] },
    ],
  },
];

// Soccer templates
const soccerTemplates: SportLayoutTemplate[] = [
  {
    id: 'soccer-433',
    sportKey: 'soccer_boys',
    templateKey: '4_3_3',
    displayName: '4-3-3',
    templateType: 'field_map',
    aspectRatio: '3/4',
    slots: [
      { key: 'GK', label: 'GK', x: 50, y: 95, positionKeys: ['GK'] },
      { key: 'LB', label: 'LB', x: 15, y: 75, positionKeys: ['LB', 'D'] },
      { key: 'CB1', label: 'CB', x: 35, y: 80, positionKeys: ['CB', 'D'] },
      { key: 'CB2', label: 'CB', x: 65, y: 80, positionKeys: ['CB', 'D'] },
      { key: 'RB', label: 'RB', x: 85, y: 75, positionKeys: ['RB', 'D'] },
      { key: 'CM1', label: 'CM', x: 30, y: 55, positionKeys: ['CM', 'M', 'DM'] },
      { key: 'CM2', label: 'CM', x: 50, y: 50, positionKeys: ['CM', 'M', 'AM'] },
      { key: 'CM3', label: 'CM', x: 70, y: 55, positionKeys: ['CM', 'M', 'DM'] },
      { key: 'LW', label: 'LW', x: 15, y: 25, positionKeys: ['LW', 'F'] },
      { key: 'ST', label: 'ST', x: 50, y: 20, positionKeys: ['ST', 'F', 'CF'] },
      { key: 'RW', label: 'RW', x: 85, y: 25, positionKeys: ['RW', 'F'] },
    ],
  },
];

// Volleyball templates
const volleyballTemplates: SportLayoutTemplate[] = [
  {
    id: 'vball-rotation1',
    sportKey: 'volleyball_girls_indoor',
    templateKey: 'rotation_1',
    displayName: 'Rotation 1',
    templateType: 'rotation',
    aspectRatio: '3/2',
    slots: [
      { key: 'P1', label: '1', x: 80, y: 80, positionKeys: ['OH', 'RS'] },
      { key: 'P2', label: '2', x: 80, y: 20, positionKeys: ['RS', 'S'] },
      { key: 'P3', label: '3', x: 50, y: 20, positionKeys: ['MB', 'OH'] },
      { key: 'P4', label: '4', x: 20, y: 20, positionKeys: ['OH'] },
      { key: 'P5', label: '5', x: 20, y: 80, positionKeys: ['S', 'MB'] },
      { key: 'P6', label: '6', x: 50, y: 80, positionKeys: ['MB', 'L'] },
    ],
  },
];

// Baseball templates
const baseballTemplates: SportLayoutTemplate[] = [
  {
    id: 'baseball-field',
    sportKey: 'baseball',
    templateKey: 'field_positions',
    displayName: 'Field Positions',
    templateType: 'field_map',
    aspectRatio: '1/1',
    slots: [
      { key: 'P', label: 'P', x: 50, y: 60, positionKeys: ['P'] },
      { key: 'C', label: 'C', x: 50, y: 85, positionKeys: ['C'] },
      { key: '1B', label: '1B', x: 72, y: 55, positionKeys: ['1B', 'IF'] },
      { key: '2B', label: '2B', x: 60, y: 40, positionKeys: ['2B', 'IF'] },
      { key: 'SS', label: 'SS', x: 40, y: 40, positionKeys: ['SS', 'IF'] },
      { key: '3B', label: '3B', x: 28, y: 55, positionKeys: ['3B', 'IF'] },
      { key: 'LF', label: 'LF', x: 20, y: 20, positionKeys: ['LF', 'OF'] },
      { key: 'CF', label: 'CF', x: 50, y: 15, positionKeys: ['CF', 'OF'] },
      { key: 'RF', label: 'RF', x: 80, y: 20, positionKeys: ['RF', 'OF'] },
    ],
  },
];

// Grouped list fallback for any sport
const groupedListTemplate: SportLayoutTemplate = {
  id: 'grouped-list',
  sportKey: '*',
  templateKey: 'grouped_list',
  displayName: 'Roster List',
  templateType: 'grouped_list',
  aspectRatio: '1/1',
  slots: [], // Uses grouped list rendering instead
};

// Export all templates
export const sportLayoutTemplates: SportLayoutTemplate[] = [
  ...football11ManTemplates,
  ...basketballTemplates,
  ...soccerTemplates,
  ...volleyballTemplates,
  ...baseballTemplates,
  groupedListTemplate,
];

// Get templates for a sport
export function getTemplatesForSport(sportKey: string): SportLayoutTemplate[] {
  const sportTemplates = sportLayoutTemplates.filter(
    t => t.sportKey === sportKey || t.sportKey === '*'
  );
  
  // If no sport-specific templates, return just the fallback
  if (sportTemplates.length === 1 && sportTemplates[0].sportKey === '*') {
    return sportTemplates;
  }
  
  return sportTemplates;
}

// Get default template for a sport
export function getDefaultTemplate(sportKey: string): SportLayoutTemplate | null {
  const templates = getTemplatesForSport(sportKey);
  return templates.find(t => t.sportKey === sportKey) || templates[0] || null;
}
