/**
 * CSV Export Utilities
 * Converts data arrays to CSV format and triggers browser downloads
 */

interface ColumnConfig<T = any> {
  key: string;
  header: string;
  transform?: (value: any, item: T) => string;
}

/**
 * Escapes a value for CSV format
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Converts an array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ColumnConfig[]
): string {
  // Header row
  const header = columns.map(col => escapeCSVValue(col.header)).join(',');
  
  // Data rows
  const rows = data.map(item => 
    columns.map(col => {
      const value = item[col.key];
      const transformed = col.transform ? col.transform(value, item) : value;
      return escapeCSVValue(transformed);
    }).join(',')
  );
  
  return [header, ...rows].join('\n');
}

/**
 * Triggers a browser download of CSV content
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel compatibility with UTF-8
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  URL.revokeObjectURL(url);
}

/**
 * Column configurations for schools export
 */
export const schoolColumns: ColumnConfig[] = [
  { key: 'nces_id', header: 'NCES ID' },
  { key: 'name', header: 'Name' },
  { key: 'level', header: 'Level' },
  { key: 'school_type', header: 'Type' },
  { key: 'address', header: 'Address' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'zip', header: 'ZIP' },
  { key: 'county', header: 'County' },
  { key: 'phone', header: 'Phone' },
  { key: 'website', header: 'Website' },
  { key: 'operational_status', header: 'Status' },
];

/**
 * Column configurations for districts export
 */
export const districtColumns: ColumnConfig[] = [
  { key: 'nces_id', header: 'NCES ID' },
  { key: 'name', header: 'Name' },
  { key: 'city', header: 'City' },
  { key: 'state', header: 'State' },
  { key: 'address', header: 'Address' },
  { key: 'zip', header: 'ZIP' },
  { key: 'phone', header: 'Phone' },
  { key: 'website', header: 'Website' },
  { key: 'lea_type_text', header: 'Type' },
  { key: 'grade_range', header: 'Grade Range', transform: (_, item) => 
    item?.lowest_grade && item?.highest_grade ? `${item.lowest_grade} - ${item.highest_grade}` : '' 
  },
  { key: 'school_count', header: 'School Count' },
];

/**
 * Generates a filename with current date
 */
export function generateFilename(prefix: string): string {
  const date = new Date().toISOString().split('T')[0];
  return `${prefix}-${date}.csv`;
}
