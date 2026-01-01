// Equipment category and preset definitions for the inventory system

export interface EquipmentSubcategory {
  value: string;
  label: string;
}

export interface EquipmentCategory {
  value: string;
  label: string;
  subcategories: EquipmentSubcategory[];
}

export interface EquipmentPreset {
  name: string;
  category: string;
  subcategory: string;
  description?: string;
}

// Main categories with subcategories
export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  {
    value: 'uniforms',
    label: 'Uniforms',
    subcategories: [
      { value: 'game_jersey', label: 'Game Jersey' },
      { value: 'practice_jersey', label: 'Practice Jersey' },
      { value: 'game_pants', label: 'Game Pants' },
      { value: 'practice_pants', label: 'Practice Pants' },
      { value: 'game_shorts', label: 'Game Shorts' },
      { value: 'practice_shorts', label: 'Practice Shorts' },
      { value: 'socks', label: 'Socks' },
      { value: 'belt', label: 'Belt' },
      { value: 'warm_up_jacket', label: 'Warm-Up Jacket' },
      { value: 'warm_up_pants', label: 'Warm-Up Pants' },
    ],
  },
  {
    value: 'protective_gear',
    label: 'Protective Gear',
    subcategories: [
      { value: 'helmet', label: 'Helmet' },
      { value: 'shoulder_pads', label: 'Shoulder Pads' },
      { value: 'hip_pads', label: 'Hip Pads' },
      { value: 'thigh_pads', label: 'Thigh Pads' },
      { value: 'knee_pads', label: 'Knee Pads' },
      { value: 'elbow_pads', label: 'Elbow Pads' },
      { value: 'shin_guards', label: 'Shin Guards' },
      { value: 'mouthguard', label: 'Mouthguard' },
      { value: 'chest_protector', label: 'Chest Protector' },
      { value: 'catcher_gear', label: 'Catcher Gear' },
      { value: 'goalie_pads', label: 'Goalie Pads' },
      { value: 'facemask', label: 'Facemask' },
      { value: 'gloves', label: 'Gloves' },
    ],
  },
  {
    value: 'footwear',
    label: 'Footwear',
    subcategories: [
      { value: 'cleats', label: 'Cleats' },
      { value: 'turf_shoes', label: 'Turf Shoes' },
      { value: 'running_shoes', label: 'Running Shoes' },
      { value: 'court_shoes', label: 'Court Shoes' },
      { value: 'slides', label: 'Slides' },
    ],
  },
  {
    value: 'game_equipment',
    label: 'Game Equipment',
    subcategories: [
      { value: 'ball', label: 'Ball' },
      { value: 'bat', label: 'Bat' },
      { value: 'stick', label: 'Stick' },
      { value: 'racket', label: 'Racket' },
      { value: 'goal', label: 'Goal/Net' },
      { value: 'puck', label: 'Puck' },
      { value: 'bases', label: 'Bases' },
      { value: 'tee', label: 'Tee' },
    ],
  },
  {
    value: 'training_equipment',
    label: 'Training Equipment',
    subcategories: [
      { value: 'cones', label: 'Cones' },
      { value: 'agility_ladder', label: 'Agility Ladder' },
      { value: 'hurdles', label: 'Hurdles' },
      { value: 'resistance_bands', label: 'Resistance Bands' },
      { value: 'tackling_dummy', label: 'Tackling Dummy' },
      { value: 'sleds', label: 'Sled' },
      { value: 'blocking_pads', label: 'Blocking Pads' },
      { value: 'medicine_ball', label: 'Medicine Ball' },
      { value: 'jump_rope', label: 'Jump Rope' },
      { value: 'speed_chute', label: 'Speed Chute' },
      { value: 'practice_balls', label: 'Practice Balls' },
    ],
  },
  {
    value: 'bags_storage',
    label: 'Bags & Storage',
    subcategories: [
      { value: 'equipment_bag', label: 'Equipment Bag' },
      { value: 'ball_bag', label: 'Ball Bag' },
      { value: 'helmet_bag', label: 'Helmet Bag' },
      { value: 'bat_bag', label: 'Bat Bag' },
      { value: 'stick_bag', label: 'Stick Bag' },
      { value: 'cooler', label: 'Cooler' },
      { value: 'water_bottle_carrier', label: 'Water Bottle Carrier' },
    ],
  },
  {
    value: 'accessories',
    label: 'Accessories',
    subcategories: [
      { value: 'water_bottle', label: 'Water Bottle' },
      { value: 'towel', label: 'Towel' },
      { value: 'headband', label: 'Headband' },
      { value: 'wristband', label: 'Wristband' },
      { value: 'arm_sleeve', label: 'Arm Sleeve' },
      { value: 'leg_sleeve', label: 'Leg Sleeve' },
      { value: 'visor', label: 'Visor' },
      { value: 'eye_black', label: 'Eye Black' },
      { value: 'athletic_tape', label: 'Athletic Tape' },
    ],
  },
  {
    value: 'medical',
    label: 'Medical & First Aid',
    subcategories: [
      { value: 'first_aid_kit', label: 'First Aid Kit' },
      { value: 'ice_packs', label: 'Ice Packs' },
      { value: 'athletic_tape_medical', label: 'Athletic Tape' },
      { value: 'braces', label: 'Braces' },
      { value: 'aed', label: 'AED' },
    ],
  },
];

// Preset equipment items grouped by category for quick add
export const EQUIPMENT_PRESETS: EquipmentPreset[] = [
  // Uniforms
  { name: 'Game Jersey - Home', category: 'uniforms', subcategory: 'game_jersey', description: 'Home game jersey' },
  { name: 'Game Jersey - Away', category: 'uniforms', subcategory: 'game_jersey', description: 'Away game jersey' },
  { name: 'Practice Jersey', category: 'uniforms', subcategory: 'practice_jersey', description: 'Daily practice jersey' },
  { name: 'Game Pants', category: 'uniforms', subcategory: 'game_pants', description: 'Game day pants' },
  { name: 'Practice Pants', category: 'uniforms', subcategory: 'practice_pants', description: 'Practice pants' },
  { name: 'Game Shorts', category: 'uniforms', subcategory: 'game_shorts', description: 'Game day shorts' },
  { name: 'Practice Shorts', category: 'uniforms', subcategory: 'practice_shorts', description: 'Practice shorts' },
  { name: 'Team Socks', category: 'uniforms', subcategory: 'socks', description: 'Team colored socks' },
  { name: 'Warm-Up Jacket', category: 'uniforms', subcategory: 'warm_up_jacket', description: 'Pre-game warm-up jacket' },
  
  // Protective Gear
  { name: 'Football Helmet', category: 'protective_gear', subcategory: 'helmet', description: 'Football helmet with facemask' },
  { name: 'Baseball Helmet', category: 'protective_gear', subcategory: 'helmet', description: 'Batting helmet' },
  { name: 'Shoulder Pads', category: 'protective_gear', subcategory: 'shoulder_pads', description: 'Football shoulder pads' },
  { name: 'Hip Pads', category: 'protective_gear', subcategory: 'hip_pads' },
  { name: 'Thigh Pads', category: 'protective_gear', subcategory: 'thigh_pads' },
  { name: 'Knee Pads', category: 'protective_gear', subcategory: 'knee_pads' },
  { name: 'Shin Guards', category: 'protective_gear', subcategory: 'shin_guards' },
  { name: 'Batting Gloves', category: 'protective_gear', subcategory: 'gloves' },
  { name: 'Receiver Gloves', category: 'protective_gear', subcategory: 'gloves' },
  { name: 'Catcher\'s Gear Set', category: 'protective_gear', subcategory: 'catcher_gear', description: 'Complete catcher gear set' },
  { name: 'Goalie Pads', category: 'protective_gear', subcategory: 'goalie_pads' },
  
  // Footwear
  { name: 'Football Cleats', category: 'footwear', subcategory: 'cleats' },
  { name: 'Soccer Cleats', category: 'footwear', subcategory: 'cleats' },
  { name: 'Baseball Cleats', category: 'footwear', subcategory: 'cleats' },
  { name: 'Turf Shoes', category: 'footwear', subcategory: 'turf_shoes' },
  { name: 'Basketball Shoes', category: 'footwear', subcategory: 'court_shoes' },
  { name: 'Volleyball Shoes', category: 'footwear', subcategory: 'court_shoes' },
  
  // Game Equipment
  { name: 'Football', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Basketball', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Soccer Ball', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Volleyball', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Baseball', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Softball', category: 'game_equipment', subcategory: 'ball' },
  { name: 'Baseball Bat', category: 'game_equipment', subcategory: 'bat' },
  { name: 'Softball Bat', category: 'game_equipment', subcategory: 'bat' },
  { name: 'Lacrosse Stick', category: 'game_equipment', subcategory: 'stick' },
  { name: 'Hockey Stick', category: 'game_equipment', subcategory: 'stick' },
  { name: 'Tennis Racket', category: 'game_equipment', subcategory: 'racket' },
  
  // Training Equipment
  { name: 'Training Cones (Set)', category: 'training_equipment', subcategory: 'cones', description: 'Set of training cones' },
  { name: 'Agility Ladder', category: 'training_equipment', subcategory: 'agility_ladder' },
  { name: 'Speed Hurdles', category: 'training_equipment', subcategory: 'hurdles' },
  { name: 'Tackling Dummy', category: 'training_equipment', subcategory: 'tackling_dummy' },
  { name: 'Blocking Sled', category: 'training_equipment', subcategory: 'sleds' },
  { name: 'Practice Footballs', category: 'training_equipment', subcategory: 'practice_balls' },
  { name: 'Medicine Ball', category: 'training_equipment', subcategory: 'medicine_ball' },
  
  // Bags & Storage
  { name: 'Team Equipment Bag', category: 'bags_storage', subcategory: 'equipment_bag' },
  { name: 'Ball Bag', category: 'bags_storage', subcategory: 'ball_bag' },
  { name: 'Team Cooler', category: 'bags_storage', subcategory: 'cooler' },
  { name: 'Water Bottle Carrier', category: 'bags_storage', subcategory: 'water_bottle_carrier' },
  
  // Accessories
  { name: 'Water Bottle', category: 'accessories', subcategory: 'water_bottle' },
  { name: 'Team Towel', category: 'accessories', subcategory: 'towel' },
  { name: 'Arm Sleeve', category: 'accessories', subcategory: 'arm_sleeve' },
  
  // Medical
  { name: 'Team First Aid Kit', category: 'medical', subcategory: 'first_aid_kit' },
  { name: 'Ice Packs', category: 'medical', subcategory: 'ice_packs' },
];

export const CONDITIONS = [
  { value: 'new', label: 'New' },
  { value: 'excellent', label: 'Excellent' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'worn', label: 'Worn' },
  { value: 'damaged', label: 'Damaged' },
  { value: 'retired', label: 'Retired' },
];

export const TRACKING_METHODS = [
  { value: 'manual', label: 'Manual Entry' },
  { value: 'qr', label: 'QR Code' },
  { value: 'barcode', label: 'Barcode' },
  { value: 'rfid', label: 'RFID Tag' },
  { value: 'sticker', label: 'Sticker/Tag' },
];

// Helper function to get category label
export function getCategoryLabel(categoryValue: string): string {
  const category = EQUIPMENT_CATEGORIES.find(c => c.value === categoryValue);
  return category?.label || categoryValue;
}

// Helper function to get subcategory label
export function getSubcategoryLabel(categoryValue: string, subcategoryValue: string): string {
  const category = EQUIPMENT_CATEGORIES.find(c => c.value === categoryValue);
  const subcategory = category?.subcategories.find(s => s.value === subcategoryValue);
  return subcategory?.label || subcategoryValue;
}

// Helper function to get subcategories for a category
export function getSubcategories(categoryValue: string): EquipmentSubcategory[] {
  const category = EQUIPMENT_CATEGORIES.find(c => c.value === categoryValue);
  return category?.subcategories || [];
}

// Helper function to get presets for a category
export function getPresetsForCategory(categoryValue: string): EquipmentPreset[] {
  return EQUIPMENT_PRESETS.filter(p => p.category === categoryValue);
}
