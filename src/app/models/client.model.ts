import { CarResponse } from './car.model';

// Response DTO from API
export interface ClientResponse {
  id: number;
  firstName: string;
  name: string;
  phone: string;
  cars?: CarResponse[];
}

// Request DTO for creating/updating a client
export interface ClientRequest {
  firstName: string;
  name: string;
  phone: string;
}

// Alias pour rétrocompatibilité
export type Client = ClientResponse;

