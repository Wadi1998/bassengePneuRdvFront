import { Routes } from '@angular/router';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ClientsComponent } from './pages/clients/clients.component';
import { AppointmentsComponent } from './pages/appointments/appointments.component';
import { LoginComponent } from './pages/login/login.component';
import { loginGuard } from './pages/login/login.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent, title: 'Connexion' },
  { path: 'dashboard', component: DashboardComponent, title: 'Accueil', canActivate: [loginGuard] },
  { path: 'clients', component: ClientsComponent, title: 'Clients', canActivate: [loginGuard] },
  { path: 'prise-rendez-vous', component: AppointmentsComponent, title: 'Prise de rendez-vous', canActivate: [loginGuard] },
  { path: '**', redirectTo: 'login' }
];
