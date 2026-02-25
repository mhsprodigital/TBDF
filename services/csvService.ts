import { PatientRecord } from '../types';

/**
 * Parses a CSV string into an array of PatientRecord objects.
 * Handles quoted fields containing delimiters.
 */
export const parseCSV = (csvText: string): PatientRecord[] => {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== '');
  if (lines.length === 0) return [];

  const headers = parseCSVLine(lines[0]);
  const data: PatientRecord[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const record: PatientRecord = {};
      headers.forEach((header, index) => {
        // Clean header name to be safe keys
        const cleanHeader = header.trim(); 
        record[cleanHeader] = values[index];
      });
      // Ensure we have a unique ID. If NU_NOTIFIC is missing, generate a temporary one
      if (!record['NU_NOTIFIC']) {
        record['NU_NOTIFIC'] = `TEMP-${Date.now()}-${i}`;
      }
      data.push(record);
    }
  }

  return data;
};

/**
 * Helper to parse a single CSV line handling quotes.
 */
const parseCSVLine = (text: string): string[] => {
  const result: string[] = [];
  // Robust simple split for Comma or Semicolon detection
  const separator = text.indexOf(';') > -1 && text.indexOf(',') === -1 ? ';' : ',';
  
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === separator && !inQuotes) {
      result.push(cleanField(currentField));
      currentField = '';
    } else {
      currentField += char;
    }
  }
  result.push(cleanField(currentField));
  
  return result;
};

const cleanField = (field: string): string => {
  let f = field.trim();
  if (f.startsWith('"') && f.endsWith('"')) {
    f = f.substring(1, f.length - 1);
  }
  return f;
};

export const generateCSV = (data: PatientRecord[]): string => {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [
    headers.join(','), // Header row
    ...data.map(row => headers.map(fieldName => {
      const val = row[fieldName] || '';
      // Escape quotes and wrap in quotes if contains comma
      const escaped = val.replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(','))
  ];
  return csvRows.join('\n');
};

// --- DATE HELPERS ---

/**
 * Converts SINAN CSV Date (DD/MM/YYYY) to HTML Input Date (YYYY-MM-DD)
 */
export const toInputDate = (csvDate: string): string => {
  if (!csvDate) return '';
  // Check if already in YYYY-MM-DD (sometimes happens)
  if (csvDate.match(/^\d{4}-\d{2}-\d{2}$/)) return csvDate;
  
  const parts = csvDate.split('/');
  if (parts.length === 3) {
    // DD/MM/YYYY -> YYYY-MM-DD
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return csvDate; // Return as is if format unknown
};

/**
 * Converts HTML Input Date (YYYY-MM-DD) to SINAN CSV Date (DD/MM/YYYY)
 */
export const fromInputDate = (inputDate: string): string => {
  if (!inputDate) return '';
  const parts = inputDate.split('-');
  if (parts.length === 3) {
    // YYYY-MM-DD -> DD/MM/YYYY
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return inputDate;
};
