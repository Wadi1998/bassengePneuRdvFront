import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideToastr } from 'ngx-toastr';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';

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
  ],
}).catch(err => console.error(err));
