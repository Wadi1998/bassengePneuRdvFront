/**
 * @file Auth Interceptor
 * @description Intercepteur HTTP pour ajouter le token Keycloak aux requêtes API.
 */

import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, switchMap } from 'rxjs';
import { KeycloakService } from './keycloak.service';
import { environment } from '../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const keycloakService = inject(KeycloakService);

  // N'ajoute le token que pour les requêtes vers l'API backend
  if (!req.url.startsWith(environment.apiBase)) {
    return next(req);
  }

  // Si pas authentifié, passe la requête sans token
  if (!keycloakService.isAuthenticated()) {
    return next(req);
  }

  // Récupère le token et l'ajoute à la requête
  return from(keycloakService.getToken()).pipe(
    switchMap(token => {
      if (token) {
        const authReq = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });
        return next(authReq);
      }
      return next(req);
    })
  );
};
