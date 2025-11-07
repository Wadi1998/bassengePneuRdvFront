import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', component: DashboardComponent, title: 'Accueil' },
  { path: 'clients', component: ClientsComponent, title: 'Clients' },
  { path: 'prise-rendez-vous', component: AppointmentsComponent, title: 'Prise de rendez-vous' },
  { path: '**', redirectTo: 'dashboard' }
];
