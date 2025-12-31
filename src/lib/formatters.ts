/**
 * Format district names to handle "of the City of" pattern
 * Example: "Wyandotte School District of the City of" -> "The City of Wyandotte School District"
 */
export function formatDistrictName(name: string | null | undefined): string {
  if (!name) return '';
  
  // Pattern: "[Name] of the City of" at the end
  // Should become: "The City of [Name]"
  const pattern = /^(.+?)\s+of the City of\s*$/i;
  const match = name.match(pattern);
  
  if (match) {
    return `The City of ${match[1]}`;
  }
  
  return name;
}
