import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { LOCALE_ID, APP_INITIALIZER } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { KeycloakService } from './app/services/keycloak.service';
import { authInterceptor } from './app/services/auth.interceptor';

// Enregistrer la locale française
registerLocaleData(localeFr, 'fr');

// ngx-translate providers
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

// Factory for a minimal TranslateLoader (reads assets/i18n/{lang}.json)
export function translateLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string) => http.get(`assets/i18n/${lang}.json`)
  } as TranslateLoader;
}

// Factory pour initialiser Keycloak
export function initializeKeycloakFactory(keycloakService: KeycloakService) {
  return () => keycloakService.init();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor])
    ),
    provideAnimations(),
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 2500,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true,
    }),
    { provide: LOCALE_ID, useValue: 'fr-FR' },

    // Keycloak Service et initialization
    KeycloakService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeKeycloakFactory,
      deps: [KeycloakService],
      multi: true
    },

    // Import ngx-translate providers
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: translateLoaderFactory,
          deps: [HttpClient]
        }
      })
    )
  ],
}).catch(err => console.error(err));
