/**
 * Season and School Year Utilities
 * 
 * Provides smart defaults for season and year selection based on current date
 * and typical school athletic schedules.
 */

export type SportSeasonType = 'fall' | 'winter' | 'spring' | 'summer' | 'year_round' | 'varies' | 'custom';

export const SEASON_LABELS: Record<SportSeasonType, string> = {
  fall: 'Fall',
  winter: 'Winter',
  spring: 'Spring',
  summer: 'Summer',
  year_round: 'Year-Round',
  varies: 'Varies by State',
  custom: 'Custom',
};

export const SEASON_DATE_RANGES: Record<Exclude<SportSeasonType, 'varies' | 'custom' | 'year_round'>, { startMonth: number; endMonth: number }> = {
  fall: { startMonth: 8, endMonth: 11 },      // Aug - Nov
  winter: { startMonth: 11, endMonth: 2 },    // Nov - Feb (wraps)
  spring: { startMonth: 2, endMonth: 5 },     // Feb - May
  summer: { startMonth: 5, endMonth: 7 },     // May - Jul
};

/**
 * Determines the current active season based on today's date
 */
export function getCurrentSeason(): SportSeasonType {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed

  // August - October: Fall
  if (month >= 7 && month <= 10) return 'fall';
  // November - February: Winter
  if (month >= 10 || month <= 1) return 'winter';
  // March - May: Spring
  if (month >= 2 && month <= 4) return 'spring';
  // June - July: Summer
  return 'summer';
}

/**
 * Calculates the current school year based on today's date.
 * School years run Aug-Jul, so:
 * - Aug 2025 - Jul 2026 = school year 2025
 */
export function getCurrentSchoolYear(): number {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();

  // If we're in Aug-Dec, we're in the current calendar year's school year
  // If we're in Jan-Jul, we're still in the previous calendar year's school year
  if (month >= 7) {
    return year;
  }
  return year - 1;
}

/**
 * Generates the season year label (e.g., "2024-2025")
 */
export function getSeasonYearLabel(schoolYear: number): string {
  return `${schoolYear}-${schoolYear + 1}`;
}

/**
 * Gets available school years for selection
 * Returns: previous 2 years, current year, next 2 years
 */
export function getAvailableSchoolYears(includeExtended = false): number[] {
  const currentYear = getCurrentSchoolYear();
  const years: number[] = [];

  // Previous years
  const pastYears = includeExtended ? 5 : 2;
  for (let i = pastYears; i > 0; i--) {
    years.push(currentYear - i);
  }

  // Current year
  years.push(currentYear);

  // Future years
  const futureYears = includeExtended ? 5 : 2;
  for (let i = 1; i <= futureYears; i++) {
    years.push(currentYear + i);
  }

  return years;
}

/**
 * Determines if a given year is past, current, or future
 */
export function getYearStatus(year: number): 'past' | 'current' | 'future' {
  const currentYear = getCurrentSchoolYear();
  if (year < currentYear) return 'past';
  if (year > currentYear) return 'future';
  return 'current';
}

/**
 * Gets the default season for a sport based on state rules
 */
export interface SeasonDefault {
  season: SportSeasonType;
  source: 'school' | 'state' | 'national' | 'unknown';
}

export function getSeasonForSport(
  sportKey: string,
  stateCode?: string,
  sportSeasonDefaults?: Array<{
    state_code: string;
    sport_key: string;
    default_season: SportSeasonType;
  }>,
  nationalDefault?: SportSeasonType
): SeasonDefault {
  // 1. Check state-specific defaults
  if (stateCode && sportSeasonDefaults) {
    const stateDefault = sportSeasonDefaults.find(
      (d) => d.state_code === stateCode && d.sport_key === sportKey
    );
    if (stateDefault) {
      return { season: stateDefault.default_season, source: 'state' };
    }
  }

  // 2. Fall back to national default
  if (nationalDefault && nationalDefault !== 'varies') {
    return { season: nationalDefault, source: 'national' };
  }

  // 3. Use current season as fallback
  return { season: getCurrentSeason(), source: 'unknown' };
}

/**
 * Formats a season and year for display
 */
export function formatSeasonYear(season: SportSeasonType, schoolYear: number): string {
  const seasonLabel = SEASON_LABELS[season];
  const yearLabel = getSeasonYearLabel(schoolYear);
  return `${seasonLabel} ${yearLabel}`;
}
