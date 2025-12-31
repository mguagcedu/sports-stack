// Client-side CSV parser for school imports

export interface SchoolRow {
  nces_id: string | null;
  name: string;
  state: string | null;
  city: string | null;
  address: string | null;
  zip: string | null;
  phone: string | null;
  website: string | null;
  level: string | null;
  school_type: string | null;
  operational_status: string | null;
  district_nces_id: string | null;
  district_name: string | null;
  state_name: string | null;
  county: string | null;
  latitude: number | null;
  longitude: number | null;
  school_year: string | null;
  sy_status: string | null;
  charter_status: string | null;
  magnet_status: string | null;
  virtual_status: string | null;
  title1_status: string | null;
}

export interface DistrictData {
  nces_id: string;
  name: string;
  state: string;
  state_name: string;
}

// Parse scientific notation like 2.91107E+11 to full integer string
function parseScientificNotation(value: string): string {
  if (!value) return '';
  const trimmed = value.trim().replace(/^"|"$/g, '');
  
  const match = trimmed.match(/^(\d+\.?\d*)E\+(\d+)$/i);
  if (match) {
    const base = parseFloat(match[1]);
    const exp = parseInt(match[2]);
    return Math.round(base * Math.pow(10, exp)).toString();
  }
  return trimmed;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

function cleanValue(val: string | undefined): string {
  if (!val) return '';
  return val.trim().replace(/^"|"$/g, '');
}

// Detect if CSV is headerless (Part 2 format starts with year like "2024-2025")
function detectHeaderlessCSV(firstLine: string): boolean {
  const trimmed = firstLine.trim();
  return /^\d{4}-\d{4}/.test(trimmed) || /^"\d{4}-\d{4}"/.test(trimmed);
}

function mapPositionalColumns(values: string[]): SchoolRow | null {
  const ncesIdRaw = values[11] || '';
  const ncesId = parseScientificNotation(ncesIdRaw);
  const name = cleanValue(values[4]);
  
  if (!name) return null;
  
  const districtNcesRaw = values[9] || '';
  const districtNces = parseScientificNotation(districtNcesRaw);
  
  return {
    nces_id: ncesId || null,
    name: name,
    state: cleanValue(values[3]) || null,
    state_name: cleanValue(values[2]) || null,
    city: cleanValue(values[16]) || null,
    address: cleanValue(values[20]) || null,
    zip: cleanValue(values[18]) || null,
    phone: cleanValue(values[27]) || null,
    website: cleanValue(values[28]) || null,
    level: cleanValue(values[62]) || null,
    school_type: cleanValue(values[35]) || null,
    operational_status: cleanValue(values[31]) || null,
    district_nces_id: districtNces || null,
    district_name: cleanValue(values[5]) || null,
    county: cleanValue(values[14]) || null,
    latitude: parseFloat(cleanValue(values[22])) || null,
    longitude: parseFloat(cleanValue(values[23])) || null,
    school_year: cleanValue(values[0]) || null,
    sy_status: cleanValue(values[31]) || null,
    charter_status: cleanValue(values[36]) || null,
    magnet_status: cleanValue(values[37]) || null,
    virtual_status: cleanValue(values[38]) || null,
    title1_status: cleanValue(values[45]) || null,
  };
}

export function parseCSV(csvText: string): { schools: SchoolRow[]; format: string } {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return { schools: [], format: 'unknown' };

  const firstLine = lines[0];
  const isHeaderless = detectHeaderlessCSV(firstLine);

  if (isHeaderless) {
    // Headerless format (Part 2)
    const schools: SchoolRow[] = [];
    for (const line of lines) {
      const values = parseCSVLine(line);
      const row = mapPositionalColumns(values);
      if (row) schools.push(row);
    }
    return { schools, format: 'headerless (Part 2)' };
  }

  // Format with headers (Part 1)
  const headers = parseCSVLine(lines[0]);
  const headerMap: Record<string, number> = {};
  headers.forEach((h, i) => {
    headerMap[cleanValue(h).toUpperCase()] = i;
  });

  const getValue = (values: string[], key: string): string => {
    const idx = headerMap[key];
    return idx !== undefined ? cleanValue(values[idx]) : '';
  };

  const schools: SchoolRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;
    
    const name = getValue(values, 'SCH_NAME') || getValue(values, 'SCHOOL_NAME') || getValue(values, 'NAME');
    if (!name) continue;
    
    const ncesId = parseScientificNotation(getValue(values, 'NCESSCH') || getValue(values, 'NCES_ID') || getValue(values, 'SCHOOLID'));
    
    schools.push({
      nces_id: ncesId || null,
      name,
      state: getValue(values, 'ST') || getValue(values, 'STATE') || null,
      state_name: getValue(values, 'STATENAME') || getValue(values, 'STATE_NAME') || null,
      city: getValue(values, 'LCITY') || getValue(values, 'CITY') || null,
      address: getValue(values, 'LSTREET1') || getValue(values, 'ADDRESS') || null,
      zip: getValue(values, 'LZIP') || getValue(values, 'ZIP') || null,
      phone: getValue(values, 'PHONE') || null,
      website: getValue(values, 'WEBSITE') || null,
      level: getValue(values, 'LEVEL') || getValue(values, 'SCH_LEVEL') || getValue(values, 'SCHOOL_LEVEL') || null,
      school_type: getValue(values, 'SCH_TYPE_TEXT') || getValue(values, 'SCH_TYPE') || getValue(values, 'SCHOOL_TYPE') || getValue(values, 'CHARTER_TEXT') || null,
      operational_status: getValue(values, 'SY_STATUS_TEXT') || getValue(values, 'OPERATIONAL_STATUS') || getValue(values, 'STATUS') || null,
      district_nces_id: parseScientificNotation(getValue(values, 'LEAID') || getValue(values, 'LEA_ID') || getValue(values, 'DISTRICT_ID')) || null,
      district_name: getValue(values, 'LEA_NAME') || getValue(values, 'DISTRICT_NAME') || null,
      county: getValue(values, 'CNTY') || getValue(values, 'COUNTY') || null,
      latitude: parseFloat(getValue(values, 'LAT')) || null,
      longitude: parseFloat(getValue(values, 'LON')) || null,
      school_year: getValue(values, 'SCHOOL_YEAR') || getValue(values, 'SY_YEAR') || null,
      sy_status: getValue(values, 'SY_STATUS') || getValue(values, 'SY_STATUS_TEXT') || null,
      charter_status: getValue(values, 'CHARTER') || getValue(values, 'CHARTER_TEXT') || null,
      magnet_status: getValue(values, 'MAGNET') || getValue(values, 'MAGNET_TEXT') || null,
      virtual_status: getValue(values, 'VIRTUAL') || getValue(values, 'VIRTUAL_TEXT') || null,
      title1_status: getValue(values, 'TITLE1_STATUS') || getValue(values, 'TITLE_I_ELIGIBLE') || null,
    });
  }

  return { schools, format: 'with headers (Part 1)' };
}

export function extractDistricts(schools: SchoolRow[]): DistrictData[] {
  const districtMap = new Map<string, DistrictData>();
  
  for (const school of schools) {
    if (school.district_nces_id && !districtMap.has(school.district_nces_id)) {
      districtMap.set(school.district_nces_id, {
        nces_id: school.district_nces_id,
        name: school.district_name || '',
        state: school.state || '',
        state_name: school.state_name || '',
      });
    }
  }
  
  return Array.from(districtMap.values());
}
