/**
 * @file Application Routes
 * @description Configuration des routes avec lazy loading et protection Keycloak.
 * @module routes
 */

import { Routes } from '@angular/router';
import { authGuard, loginPageGuard, rootRedirectGuard } from './guards/auth.guard';

// ─────────────────────────────────────────────────────────────────────────────
// Routes avec Lazy Loading et Protection Keycloak
// ─────────────────────────────────────────────────────────────────────────────

export const routes: Routes = [
  // Racine - redirection dynamique basée sur l'état d'authentification
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootRedirectGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // Authentification - page de login
  {
    path: 'login',
    title: 'Connexion',
    canActivate: [loginPageGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // Dashboard (lazy loaded, protégé)
  {
    path: 'dashboard',
    title: 'Calendrier',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Clients (lazy loaded, protégé)
  {
    path: 'clients',
    title: 'Clients',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent)
  },

  // Rendez-vous (lazy loaded, protégé)
  {
    path: 'gestion-rendez-vous',
    title: 'Gestion des rendez-vous',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent)
  },

  // Redirections
  { path: 'prise-rendez-vous', redirectTo: 'gestion-rendez-vous' },
  { path: '**', redirectTo: 'login' }
];
