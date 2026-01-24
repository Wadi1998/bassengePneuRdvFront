/**
 * @file Application Routes
 * @description Configuration des routes avec lazy loading pour optimiser les performances.
 * @module routes
 */

import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { loginGuard } from './pages/login/login.guard';

// ─────────────────────────────────────────────────────────────────────────────
// Guards
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Guard pour la redirection dynamique à la racine.
 * Redirige vers le dashboard si connecté, sinon vers login.
 */
const rootRedirectGuard = () => {
  const router = inject(Router);
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  return router.parseUrl(isLoggedIn ? '/dashboard' : '/login');
};

// ─────────────────────────────────────────────────────────────────────────────
// Routes avec Lazy Loading
// ─────────────────────────────────────────────────────────────────────────────

export const routes: Routes = [
  // Racine - redirection dynamique
  {
    path: '',
    pathMatch: 'full',
    canActivate: [rootRedirectGuard],
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // Authentification
  {
    path: 'login',
    title: 'Connexion',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // Dashboard (lazy loaded)
  {
    path: 'dashboard',
    title: 'Calendrier',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },

  // Clients (lazy loaded)
  {
    path: 'clients',
    title: 'Clients',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/clients/clients.component').then(m => m.ClientsComponent)
  },

  // Rendez-vous (lazy loaded)
  {
    path: 'gestion-rendez-vous',
    title: 'Gestion des rendez-vous',
    canActivate: [loginGuard],
    loadComponent: () => import('./pages/appointments/appointments.component').then(m => m.AppointmentsComponent)
  },

  // Redirections
  { path: 'prise-rendez-vous', redirectTo: 'gestion-rendez-vous' },
  { path: '**', redirectTo: 'login' }
];
