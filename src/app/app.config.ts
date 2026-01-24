/**
 * @file Application Configuration
 * @description Configuration optimisée pour les performances.
 * @module config
 */

import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection
} from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules, withViewTransitions } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

// ─────────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────────

export const appConfig: ApplicationConfig = {
  providers: [
    // Error handling global
    provideBrowserGlobalErrorListeners(),

    // Zoneless = meilleures performances (pas de Zone.js overhead)
    provideZonelessChangeDetection(),

    // Router avec preloading des modules lazy-loaded après chargement initial
    provideRouter(
      routes,
      withPreloading(PreloadAllModules), // Précharge les routes en arrière-plan
      withViewTransitions() // Transitions fluides entre les pages
    ),

    // HTTP Client optimisé avec fetch API native
    provideHttpClient(
      withFetch() // Utilise fetch() au lieu de XHR pour de meilleures performances
    ),

    // Hydration pour SSR
    provideClientHydration(withEventReplay())
  ]
};
