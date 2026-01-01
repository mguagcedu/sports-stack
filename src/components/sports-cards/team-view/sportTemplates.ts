import { SportLayoutTemplate } from './types';

// Football 11-man OFFENSE templates
const footballOffenseTemplates: SportLayoutTemplate[] = [
  {
    id: 'fb11-offense-shotgun',
    sportKey: 'football_11_man',
    templateKey: 'shotgun',
    displayName: 'Shotgun',
    templateType: 'formation',
    side: 'offense',
    aspectRatio: '16/10',
    slots: [
      { key: 'QB', label: 'QB', x: 50, y: 50, positionKeys: ['QB'] },
      { key: 'RB', label: 'RB', x: 40, y: 50, positionKeys: ['RB', 'HB', 'FB'] },
      { key: 'WR1', label: 'WR', x: 5, y: 75, positionKeys: ['WR'] },
      { key: 'WR2', label: 'WR', x: 95, y: 75, positionKeys: ['WR'] },
      { key: 'WR3', label: 'SLOT', x: 20, y: 70, positionKeys: ['WR', 'SLOT'] },
      { key: 'TE', label: 'TE', x: 80, y: 75, positionKeys: ['TE'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['LT', 'OL', 'OT'] },
      { key: 'LG', label: 'LG', x: 40, y: 75, positionKeys: ['LG', 'OL', 'OG'] },
      { key: 'C', label: 'C', x: 50, y: 75, positionKeys: ['C', 'OL'] },
      { key: 'RG', label: 'RG', x: 60, y: 75, positionKeys: ['RG', 'OL', 'OG'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['RT', 'OL', 'OT'] },
    ],
  },
  {
    id: 'fb11-offense-wishbone',
    sportKey: 'football_11_man',
    templateKey: 'wishbone',
    displayName: 'Wishbone',
    templateType: 'formation',
    side: 'offense',
    aspectRatio: '16/10',
    slots: [
      { key: 'QB', label: 'QB', x: 50, y: 65, positionKeys: ['QB'] },
      { key: 'FB', label: 'FB', x: 50, y: 50, positionKeys: ['FB', 'RB'] },
      { key: 'HB1', label: 'HB', x: 35, y: 40, positionKeys: ['HB', 'RB'] },
      { key: 'HB2', label: 'HB', x: 65, y: 40, positionKeys: ['HB', 'RB'] },
      { key: 'WR1', label: 'SE', x: 5, y: 75, positionKeys: ['WR', 'SE'] },
      { key: 'TE', label: 'TE', x: 80, y: 75, positionKeys: ['TE'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['LT', 'OL', 'OT'] },
      { key: 'LG', label: 'LG', x: 40, y: 75, positionKeys: ['LG', 'OL', 'OG'] },
      { key: 'C', label: 'C', x: 50, y: 75, positionKeys: ['C', 'OL'] },
      { key: 'RG', label: 'RG', x: 60, y: 75, positionKeys: ['RG', 'OL', 'OG'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['RT', 'OL', 'OT'] },
    ],
  },
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
      { key: 'RB', label: 'TB', x: 50, y: 35, positionKeys: ['RB', 'TB', 'HB'] },
      { key: 'WR1', label: 'WR', x: 10, y: 75, positionKeys: ['WR'] },
      { key: 'WR2', label: 'WR', x: 90, y: 75, positionKeys: ['WR'] },
      { key: 'TE', label: 'TE', x: 75, y: 75, positionKeys: ['TE'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['LT', 'OL', 'OT'] },
      { key: 'LG', label: 'LG', x: 40, y: 75, positionKeys: ['LG', 'OL', 'OG'] },
      { key: 'C', label: 'C', x: 50, y: 75, positionKeys: ['C', 'OL'] },
      { key: 'RG', label: 'RG', x: 60, y: 75, positionKeys: ['RG', 'OL', 'OG'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['RT', 'OL', 'OT'] },
    ],
  },
  {
    id: 'fb11-offense-spread',
    sportKey: 'football_11_man',
    templateKey: 'spread',
    displayName: 'Spread',
    templateType: 'formation',
    side: 'offense',
    aspectRatio: '16/10',
    slots: [
      { key: 'QB', label: 'QB', x: 50, y: 50, positionKeys: ['QB'] },
      { key: 'RB', label: 'RB', x: 50, y: 35, positionKeys: ['RB', 'HB'] },
      { key: 'WR1', label: 'WR', x: 5, y: 75, positionKeys: ['WR'] },
      { key: 'WR2', label: 'WR', x: 95, y: 75, positionKeys: ['WR'] },
      { key: 'SLOT1', label: 'SLOT', x: 18, y: 68, positionKeys: ['WR', 'SLOT'] },
      { key: 'SLOT2', label: 'SLOT', x: 82, y: 68, positionKeys: ['WR', 'SLOT'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['LT', 'OL', 'OT'] },
      { key: 'LG', label: 'LG', x: 40, y: 75, positionKeys: ['LG', 'OL', 'OG'] },
      { key: 'C', label: 'C', x: 50, y: 75, positionKeys: ['C', 'OL'] },
      { key: 'RG', label: 'RG', x: 60, y: 75, positionKeys: ['RG', 'OL', 'OG'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['RT', 'OL', 'OT'] },
    ],
  },
];

// Football 11-man DEFENSE templates
const footballDefenseTemplates: SportLayoutTemplate[] = [
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
      { key: 'DT1', label: 'DT', x: 40, y: 75, positionKeys: ['DT', 'DL', 'NT'] },
      { key: 'DT2', label: 'DT', x: 60, y: 75, positionKeys: ['DT', 'DL', 'NT'] },
      { key: 'DE2', label: 'DE', x: 75, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'WILL', label: 'WILL', x: 20, y: 55, positionKeys: ['OLB', 'LB', 'WILL'] },
      { key: 'MIKE', label: 'MIKE', x: 50, y: 55, positionKeys: ['MLB', 'LB', 'MIKE'] },
      { key: 'SAM', label: 'SAM', x: 80, y: 55, positionKeys: ['OLB', 'LB', 'SAM'] },
      { key: 'CB1', label: 'CB', x: 10, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'CB2', label: 'CB', x: 90, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'SS', label: 'SS', x: 35, y: 20, positionKeys: ['SS', 'S', 'DB'] },
      { key: 'FS', label: 'FS', x: 65, y: 20, positionKeys: ['FS', 'S', 'DB'] },
    ],
  },
  {
    id: 'fb11-defense-34',
    sportKey: 'football_11_man',
    templateKey: '3_4_defense',
    displayName: '3-4 Defense',
    templateType: 'formation',
    side: 'defense',
    aspectRatio: '16/10',
    slots: [
      { key: 'DE1', label: 'DE', x: 30, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'NT', label: 'NT', x: 50, y: 75, positionKeys: ['NT', 'DT', 'DL'] },
      { key: 'DE2', label: 'DE', x: 70, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'OLB1', label: 'LOLB', x: 15, y: 60, positionKeys: ['OLB', 'LB', 'EDGE'] },
      { key: 'ILB1', label: 'ILB', x: 40, y: 55, positionKeys: ['ILB', 'LB', 'MLB'] },
      { key: 'ILB2', label: 'ILB', x: 60, y: 55, positionKeys: ['ILB', 'LB', 'MLB'] },
      { key: 'OLB2', label: 'ROLB', x: 85, y: 60, positionKeys: ['OLB', 'LB', 'EDGE'] },
      { key: 'CB1', label: 'CB', x: 10, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'CB2', label: 'CB', x: 90, y: 35, positionKeys: ['CB', 'DB'] },
      { key: 'SS', label: 'SS', x: 35, y: 20, positionKeys: ['SS', 'S', 'DB'] },
      { key: 'FS', label: 'FS', x: 65, y: 20, positionKeys: ['FS', 'S', 'DB'] },
    ],
  },
  {
    id: 'fb11-defense-nickel',
    sportKey: 'football_11_man',
    templateKey: 'nickel',
    displayName: 'Nickel (4-2-5)',
    templateType: 'formation',
    side: 'defense',
    aspectRatio: '16/10',
    slots: [
      { key: 'DE1', label: 'DE', x: 25, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'DT1', label: 'DT', x: 40, y: 75, positionKeys: ['DT', 'DL'] },
      { key: 'DT2', label: 'DT', x: 60, y: 75, positionKeys: ['DT', 'DL'] },
      { key: 'DE2', label: 'DE', x: 75, y: 75, positionKeys: ['DE', 'DL'] },
      { key: 'LB1', label: 'LB', x: 35, y: 55, positionKeys: ['LB', 'MLB'] },
      { key: 'LB2', label: 'LB', x: 65, y: 55, positionKeys: ['LB', 'MLB'] },
      { key: 'CB1', label: 'CB', x: 5, y: 40, positionKeys: ['CB', 'DB'] },
      { key: 'CB2', label: 'CB', x: 95, y: 40, positionKeys: ['CB', 'DB'] },
      { key: 'NICK', label: 'NICK', x: 20, y: 45, positionKeys: ['NB', 'CB', 'S', 'DB'] },
      { key: 'SS', label: 'SS', x: 35, y: 20, positionKeys: ['SS', 'S', 'DB'] },
      { key: 'FS', label: 'FS', x: 65, y: 20, positionKeys: ['FS', 'S', 'DB'] },
    ],
  },
];

// Football SPECIAL TEAMS templates
const footballSpecialTeamsTemplates: SportLayoutTemplate[] = [
  {
    id: 'fb11-st-kickoff',
    sportKey: 'football_11_man',
    templateKey: 'kickoff',
    displayName: 'Kickoff',
    templateType: 'formation',
    side: 'special_teams',
    aspectRatio: '16/10',
    slots: [
      { key: 'K', label: 'K', x: 50, y: 85, positionKeys: ['K', 'PK'] },
      { key: 'L1', label: 'L1', x: 10, y: 75, positionKeys: ['ST', 'WR', 'DB'] },
      { key: 'L2', label: 'L2', x: 22, y: 75, positionKeys: ['ST', 'LB', 'TE'] },
      { key: 'L3', label: 'L3', x: 34, y: 75, positionKeys: ['ST', 'LB'] },
      { key: 'L4', label: 'L4', x: 46, y: 75, positionKeys: ['ST', 'LB', 'DL'] },
      { key: 'R1', label: 'R1', x: 54, y: 75, positionKeys: ['ST', 'LB', 'DL'] },
      { key: 'R2', label: 'R2', x: 66, y: 75, positionKeys: ['ST', 'LB'] },
      { key: 'R3', label: 'R3', x: 78, y: 75, positionKeys: ['ST', 'LB', 'TE'] },
      { key: 'R4', label: 'R4', x: 90, y: 75, positionKeys: ['ST', 'WR', 'DB'] },
      { key: 'SAFE1', label: 'S', x: 35, y: 60, positionKeys: ['ST', 'S', 'LB'] },
      { key: 'SAFE2', label: 'S', x: 65, y: 60, positionKeys: ['ST', 'S', 'LB'] },
    ],
  },
  {
    id: 'fb11-st-punt',
    sportKey: 'football_11_man',
    templateKey: 'punt',
    displayName: 'Punt',
    templateType: 'formation',
    side: 'special_teams',
    aspectRatio: '16/10',
    slots: [
      { key: 'P', label: 'P', x: 50, y: 35, positionKeys: ['P'] },
      { key: 'LS', label: 'LS', x: 50, y: 75, positionKeys: ['LS', 'C'] },
      { key: 'PP', label: 'PP', x: 50, y: 55, positionKeys: ['PP', 'TE', 'FB'] },
      { key: 'LG1', label: 'LG', x: 35, y: 75, positionKeys: ['OL', 'TE', 'DL'] },
      { key: 'LG2', label: 'LW', x: 20, y: 75, positionKeys: ['OL', 'TE', 'LB'] },
      { key: 'LW', label: 'LW', x: 5, y: 75, positionKeys: ['WR', 'DB', 'ST'] },
      { key: 'RG1', label: 'RG', x: 65, y: 75, positionKeys: ['OL', 'TE', 'DL'] },
      { key: 'RG2', label: 'RW', x: 80, y: 75, positionKeys: ['OL', 'TE', 'LB'] },
      { key: 'RW', label: 'RW', x: 95, y: 75, positionKeys: ['WR', 'DB', 'ST'] },
      { key: 'UPB1', label: 'UPB', x: 30, y: 60, positionKeys: ['LB', 'RB', 'ST'] },
      { key: 'UPB2', label: 'UPB', x: 70, y: 60, positionKeys: ['LB', 'RB', 'ST'] },
    ],
  },
  {
    id: 'fb11-st-fg',
    sportKey: 'football_11_man',
    templateKey: 'field_goal',
    displayName: 'Field Goal / PAT',
    templateType: 'formation',
    side: 'special_teams',
    aspectRatio: '16/10',
    slots: [
      { key: 'K', label: 'K', x: 55, y: 55, positionKeys: ['K', 'PK'] },
      { key: 'H', label: 'H', x: 50, y: 50, positionKeys: ['H', 'QB', 'P'] },
      { key: 'LS', label: 'LS', x: 50, y: 75, positionKeys: ['LS', 'C'] },
      { key: 'LT', label: 'LT', x: 30, y: 75, positionKeys: ['OL', 'OT'] },
      { key: 'LG', label: 'LG', x: 38, y: 75, positionKeys: ['OL', 'OG'] },
      { key: 'RG', label: 'RG', x: 62, y: 75, positionKeys: ['OL', 'OG'] },
      { key: 'RT', label: 'RT', x: 70, y: 75, positionKeys: ['OL', 'OT'] },
      { key: 'TE1', label: 'TE', x: 22, y: 75, positionKeys: ['TE', 'OL'] },
      { key: 'TE2', label: 'TE', x: 78, y: 75, positionKeys: ['TE', 'OL'] },
      { key: 'W1', label: 'W', x: 10, y: 75, positionKeys: ['WR', 'TE', 'ST'] },
      { key: 'W2', label: 'W', x: 90, y: 75, positionKeys: ['WR', 'TE', 'ST'] },
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
  {
    id: 'bball-girls-halfcourt',
    sportKey: 'basketball_girls',
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
  {
    id: 'soccer-girls-433',
    sportKey: 'soccer_girls',
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
  slots: [],
};

// Export all templates
export const sportLayoutTemplates: SportLayoutTemplate[] = [
  ...footballOffenseTemplates,
  ...footballDefenseTemplates,
  ...footballSpecialTeamsTemplates,
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

// Get default template for a sport (offense first for football)
export function getDefaultTemplate(sportKey: string): SportLayoutTemplate | null {
  const templates = getTemplatesForSport(sportKey);
  // Prefer offense templates first
  const offenseTemplate = templates.find(t => t.side === 'offense');
  if (offenseTemplate) return offenseTemplate;
  return templates.find(t => t.sportKey === sportKey) || templates[0] || null;
}

// Get templates by side
export function getTemplatesBySide(sportKey: string, side: 'offense' | 'defense' | 'special_teams'): SportLayoutTemplate[] {
  return sportLayoutTemplates.filter(
    t => t.sportKey === sportKey && t.side === side
  );
}
