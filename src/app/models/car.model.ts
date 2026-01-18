// Response DTO from API
export interface CarResponse {
  id?: number;
  brand: string;
  model: string;
  year?: number;
  licensePlate?: string;
  clientId?: number;
  clientFullName?: string;
}

// Alias pour rétrocompatibilité
export type Car = CarResponse;

// Request DTO for creating/updating a car
export interface CarRequest {
  clientId: number;
  brand: string;
  model: string;
  year?: number;
  licensePlate?: string;
}

// Alias pour rétrocompatibilité
export type CarCreateRequest = CarRequest;
export type CarUpdateRequest = Partial<Omit<CarRequest, 'clientId'>> & { clientId?: number };
