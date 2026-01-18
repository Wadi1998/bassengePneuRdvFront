// Response DTO from API
export interface AppointmentResponse {
  id?: number;
  date: string;
  time: string;
  duration?: number;
  bay: string;
  clientId?: number;
  clientFullName?: string;
  carId?: number;
  carInfo?: string;
  serviceType?: string;
  serviceNote?: string;
}

// Request DTO for creating/updating an appointment
export interface AppointmentRequest {
  date: string;
  time: string;
  duration?: number;
  bay: string;
  clientId: number;
  carId?: number;
  serviceType?: string;
  serviceNote?: string;
}

// Alias pour rétrocompatibilité - unifié avec AppointmentResponse
export interface Appointment {
  id?: number;
  date: string;
  time: string;
  duration?: number;
  bay: string;
  clientId?: number;
  clientName?: string;
  clientFullName?: string;
  carId?: number;
  carInfo?: string;
  serviceType?: string;
  serviceNote?: string;
}
