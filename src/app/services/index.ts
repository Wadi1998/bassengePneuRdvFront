/**
 * @file Services Index
 * @description Point d'entrée centralisé pour tous les services de l'application.
 * Facilite les imports et améliore la maintenabilité.
 *
 * @example
 * import { ClientsService, CarsService, AppointmentsService } from '@app/services';
 */

// ─────────────────────────────────────────────────────────────────────────────
// API Services
// ─────────────────────────────────────────────────────────────────────────────
export { ClientsService } from './clients.service';
export { CarsService } from './cars.service';
export { AppointmentsService } from './appointments.service';

// ─────────────────────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────────────────────
export { AuthService } from './auth.service';

// ─────────────────────────────────────────────────────────────────────────────
// Internationalisation
// ─────────────────────────────────────────────────────────────────────────────
export { I18nService } from './i18n.service';
