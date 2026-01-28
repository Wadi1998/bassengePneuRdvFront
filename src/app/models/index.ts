/**
 * @file Models Index
 * @description Point d'entrée centralisé pour tous les modèles de l'application.
 * Facilite les imports et améliore la maintenabilité.
 *
 * @example
 * import { Client, Car, Appointment, PageResponse } from '@app/models';
 */

// ─────────────────────────────────────────────────────────────────────────────
// Pagination (générique)
// ─────────────────────────────────────────────────────────────────────────────
export type { PageResponse, PaginationParams } from './pagination.model';

// ─────────────────────────────────────────────────────────────────────────────
// Clients
// ─────────────────────────────────────────────────────────────────────────────
export type { Client, ClientRequest, ClientResponse } from './client.model';

// ─────────────────────────────────────────────────────────────────────────────
// Voitures
// ─────────────────────────────────────────────────────────────────────────────
export type { Car, CarRequest, CarResponse, CarCreateRequest, CarUpdateRequest } from './car.model';

// ─────────────────────────────────────────────────────────────────────────────
// Rendez-vous
// ─────────────────────────────────────────────────────────────────────────────
export type { Appointment, AppointmentRequest, AppointmentResponse, Bay } from './appointment.model';
export { BAY_VALUES } from './appointment.model';
