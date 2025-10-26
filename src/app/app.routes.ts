import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
  { path: 'clients', loadChildren: () => import('./features/clients/clients.routes').then(m => m.CLIENTS_ROUTES) },
  { path: 'rendez-vous', loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES) },
  { path: '**', redirectTo: 'dashboard' }
];
