export interface PatientRecord {
  [key: string]: string;
}

export interface FieldDefinition {
  id: string;
  label: string;
  description?: string;
  type: 'text' | 'date' | 'select' | 'textarea' | 'number';
  options?: string[]; // Simple list for dropdowns
  optionsMap?: Record<string, string>; // Map for Dictionary reference (e.g., "1": "Masculino")
}

export interface FieldGroup {
  title: string;
  fields: string[];
}

export interface DashboardStats {
  total: number;
  cured: number;
  treatment: number;
  abandoned: number;
  deaths: number;
}
