﻿import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';
import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

// Enregistrer la locale française
registerLocaleData(localeFr, 'fr');

// ngx-translate providers
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';

// Factory for a minimal TranslateLoader (reads /assets/i18n/{lang}.json)
export function translateLoaderFactory(http: HttpClient): TranslateLoader {
  return {
    getTranslation: (lang: string) => http.get(`/assets/i18n/${lang}.json`)
  } as TranslateLoader;
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),               // ✅ requis par ngx-toastr
    provideToastr({
      positionClass: 'toast-top-right',
      timeOut: 2500,
      closeButton: true,
      progressBar: true,
      preventDuplicates: true,
    }),                                // ✅ fournit ToastConfig + ToastrService
    { provide: LOCALE_ID, useValue: 'fr-FR' },  // ✅ locale française

    // Import ngx-translate providers via providers-from-module so TranslateService + loader are available
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
