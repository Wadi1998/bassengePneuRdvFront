/**
 * @file Application Configuration
 * @description Configuration optimisée avec Keycloak pour l'authentification.
 * @module config
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  APP_INITIALIZER
} from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { KeycloakService } from './services/keycloak.service';
import { authInterceptor } from './services/auth.interceptor';

// ─────────────────────────────────────────────────────────────────────────────
// Keycloak Initializer Factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Factory pour initialiser Keycloak au démarrage de l'application
 */
export function initializeKeycloakFactory(keycloakService: KeycloakService) {
  return () => keycloakService.init();
}

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    // Error handling global
    provideBrowserGlobalErrorListeners(),

    // Zoneless = meilleures performances (pas de Zone.js overhead)
    provideZonelessChangeDetection(),

    // Keycloak Service
    KeycloakService,

    // Keycloak initialization au démarrage (avec factory explicite)
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloakFactory,
      deps: [KeycloakService],
      multi: true
    },

    // Router avec preloading des modules lazy-loaded après chargement initial
    provideRouter(
      routes,
      withPreloading(PreloadAllModules), // Précharge les routes en arrière-plan
      withViewTransitions() // Transitions fluides entre les pages
    ),

    // HTTP Client optimisé avec fetch API native et intercepteur auth
    provideHttpClient(
      withFetch(), // Utilise fetch() au lieu de XHR pour de meilleures performances
      withInterceptors([authInterceptor]) // Ajoute le token aux requêtes
    ),

    // Hydration pour SSR
    provideClientHydration(withEventReplay())
  ]
};
