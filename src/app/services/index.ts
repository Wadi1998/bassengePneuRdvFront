/**
 * @file Services Index
 * @description Point d'entrée centralisé pour tous les services de l'application.
 * Facilite les imports et améliore la maintenabilité.
 *
 * @example
 * import { ClientsService, CarsService, AppointmentsService, KeycloakService } from '@app/services';
 */

// ─────────────────────────────────────────────────────────────────────────────
// API Services
// ─────────────────────────────────────────────────────────────────────────────
export { ClientsService } from './clients.service';
export { CarsService } from './cars.service';
export { AppointmentsService } from './appointments.service';

// ─────────────────────────────────────────────────────────────────────────────
// Auth / Keycloak
// ─────────────────────────────────────────────────────────────────────────────
export { KeycloakService, type UserProfile } from './keycloak.service';
export { AuthService } from './auth.service';
export { authInterceptor } from './auth.interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// Internationalisation
// ─────────────────────────────────────────────────────────────────────────────
export { I18nService } from './i18n.service';
