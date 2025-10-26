# --- create-structure.ps1 ---
# Exécute ce script depuis la racine du projet Angular

function New-Dir($p) { if (-not (Test-Path $p)) { New-Item -ItemType Directory -Force -Path $p | Out-Null } }
function New-Text($path, $content) {
  New-Dir (Split-Path $path)
  Set-Content -Path $path -Value $content -Encoding UTF8
}

# 1) Dossiers
$dirs = @(
  "src/app/core/services",
  "src/app/core/interceptors",
  "src/app/core/guards",
  "src/app/core/models",
  "src/app/core/utils",
  "src/app/shared/components",
  "src/app/shared/pipes",
  "src/app/shared/directives",
  "src/app/features/dashboard",
  "src/app/features/clients/data",
  "src/app/features/clients/state",
  "src/app/features/clients/ui",
  "src/app/features/appointments/domain",
  "src/app/features/appointments/data",
  "src/app/features/appointments/state",
  "src/app/features/appointments/ui"
)
$dirs | ForEach-Object { New-Dir $_ }

# 2) Core models
New-Text "src/app/core/models/client.model.ts" @'
export interface Client {
  id: number | string;
  firstName: string;
  name: string;
  phone?: string;
  vehicle?: string;
}
'@

New-Text "src/app/core/models/appointment.model.ts" @'
export interface Appointment {
  id: number | string;
  date: string;     // YYYY-MM-DD
  time: string;     // HH:mm
  duration: number; // minutes
  bay: 'A' | 'B';
  clientId: Client['id'];
  clientName: string;
  clientPhone?: string;
  clientVehicle?: string;
  serviceType: string;
  serviceNote?: string;
}
import type { Client } from './client.model';
'@

# 3) Core utils
New-Text "src/app/core/utils/time.ts" @'
export const STEP = 15;
export const toMin = (hhmm: string) => {
  const [h,m] = hhmm.split(':').map(Number);
  return h*60 + m;
};
export const toHHMM = (min: number) => {
  const h = Math.floor(min/60), m = min % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
};
'@

# 4) Core services/interceptors/guards/config
New-Text "src/app/core/services/http.service.ts" @'
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class HttpService {
  constructor(public http: HttpClient) {}
}
'@

New-Text "src/app/core/services/storage.service.ts" @'
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class StorageService {
  get<T>(key: string, fallback: T): T {
    try { return JSON.parse(localStorage.getItem(key) ?? '') as T } catch { return fallback; }
  }
  set<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
}
'@

New-Text "src/app/core/services/notify.service.ts" @'
import { Injectable } from '@angular/core';
@Injectable({ providedIn: 'root' })
export class NotifyService {
  info(msg: string)  { console.info(msg); }
  ok(msg: string)    { console.log(msg); }
  warn(msg: string)  { console.warn(msg); }
  err(msg: string)   { console.error(msg); }
}
'@

New-Text "src/app/core/interceptors/auth.interceptor.ts" @'
import { HttpInterceptorFn } from '@angular/common/http';
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Exemple: ajoute un header si besoin
  // const cloned = req.clone({ setHeaders: { Authorization: 'Bearer ...' }});
  // return next(cloned);
  return next(req);
};
'@

New-Text "src/app/core/guards/auth.guard.ts" @'
import { CanActivateFn } from '@angular/router';
export const authGuard: CanActivateFn = () => true;
'@

New-Text "src/app/core/core.config.ts" @'
import { ApplicationConfig, provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';

export const CORE_CONFIG: ApplicationConfig = {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
  ]
};
'@

# 5) Shared placeholder (ex: Card)
New-Text "src/app/shared/components/card.component.ts" @'
import { Component, Input } from '@angular/core';
@Component({
  standalone: true,
  selector: 'ui-card',
  template: `
  <div class="bg-white border rounded-2xl shadow-sm p-4"><ng-content/></div>
  `
})
export class CardComponent { @Input() title = ''; }
'@

# 6) Dashboard feature
New-Text "src/app/features/dashboard/dashboard.page.ts" @'
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
@Component({
  standalone: true,
  selector: 'app-dashboard-page',
  imports: [CommonModule],
  templateUrl: './dashboard.page.html'
})
export class DashboardPage {}
'@

New-Text "src/app/features/dashboard/dashboard.page.html" @'
<div class="max-w-5xl mx-auto px-4 py-6">
  <h1 class="text-3xl font-bold mb-2">Bienvenue 👋</h1>
  <p class="text-slate-600 mb-4">Aperçu des rendez-vous du jour.</p>
  <div class="bg-white rounded-xl border shadow p-4">Aujourd’hui — Aucun rendez-vous.</div>
</div>
'@

New-Text "src/app/features/dashboard/dashboard.routes.ts" @'
import { Routes } from '@angular/router';
import { DashboardPage } from './dashboard.page';
export const DASHBOARD_ROUTES: Routes = [{ path: '', component: DashboardPage, title: 'Accueil' }];
'@

# 7) Clients feature (repo + store + UI + routes)
New-Text "src/app/features/clients/data/client.repository.ts" @'
import { Observable } from 'rxjs';
import { Client } from '../../../core/models/client.model';
export abstract class ClientRepository {
  abstract list(): Observable<Client[]>;
  abstract create(dto: Omit<Client,'id'>): Observable<Client>;
  abstract update(id: Client['id'], patch: Partial<Client>): Observable<Client>;
  abstract remove(id: Client['id']): Observable<void>;
}
'@

New-Text "src/app/features/clients/data/client.local.repository.ts" @'
import { Injectable } from '@angular/core';
import { of, Observable } from 'rxjs';
import { Client } from '../../../core/models/client.model';
import { ClientRepository } from './client.repository';

const LS = 'gp_clients';

@Injectable({ providedIn: 'root' })
export class ClientLocalRepository implements ClientRepository {
  private read(): Client[] { return JSON.parse(localStorage.getItem(LS) || '[]'); }
  private write(v: Client[]) { localStorage.setItem(LS, JSON.stringify(v)); }

  list(): Observable<Client[]> { return of(this.read()); }
  create(dto: Omit<Client,'id'>): Observable<Client> {
    const c: Client = { id: Date.now(), ...dto }; const all = this.read(); all.push(c); this.write(all); return of(c);
  }
  update(id: Client['id'], patch: Partial<Client>): Observable<Client> {
    const all = this.read().map(x => x.id===id ? { ...x, ...patch } : x); this.write(all);
    return of(all.find(x => x.id===id)!);
  }
  remove(id: Client['id']): Observable<void> { this.write(this.read().filter(x => x.id!==id)); return of(void 0); }
}
'@

New-Text "src/app/features/clients/state/clients.store.ts" @'
import { Injectable, signal, computed } from '@angular/core';
import { Client } from '../../../core/models/client.model';
import { ClientLocalRepository } from '../data/client.local.repository';

@Injectable({ providedIn: 'root' })
export class ClientsStore {
  private readonly _items = signal<Client[]>([]);
  readonly items = computed(() => this._items());
  readonly count = computed(() => this._items().length);

  constructor(private repo: ClientLocalRepository) {}
  load() { this.repo.list().subscribe(v => this._items.set(v)); }
  add(dto: Omit<Client,'id'>) { this.repo.create(dto).subscribe(v => this._items.update(a => [...a, v])); }
  remove(id: Client['id']) { this.repo.remove(id).subscribe(() => this._items.update(a => a.filter(x=>x.id!==id))); }
}
'@

New-Text "src/app/features/clients/ui/clients.page.ts" @'
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ClientsStore } from '../state/clients.store';

@Component({
  standalone: true,
  selector: 'app-clients-page',
  imports: [CommonModule, FormsModule],
  templateUrl: './clients.page.html'
})
export class ClientsPage {
  q = '';
  items = this.store.items;
  count = this.store.count;
  form = { firstName: '', name: '', phone: '', vehicle: '' };

  constructor(private store: ClientsStore) { this.store.load(); }

  add() {
    if (!this.form.firstName.trim() || !this.form.name.trim()) return;
    this.store.add(this.form); this.form = { firstName: '', name: '', phone: '', vehicle: '' };
  }
  remove(id: any) { this.store.remove(id); }
}
'@

New-Text "src/app/features/clients/ui/clients.page.html" @'
<section class="max-w-6xl mx-auto px-4 py-6">
  <div class="flex items-center justify-between mb-4">
    <h2 class="text-2xl font-semibold">Clients</h2>
    <span class="text-xs text-slate-500">{{ count() }} client(s)</span>
  </div>

  <div class="bg-white rounded-2xl border shadow-sm p-4 mb-4 grid gap-3 md:grid-cols-6">
    <input class="border rounded-xl px-3 py-2.5" placeholder="Prénom *" [(ngModel)]="form.firstName">
    <input class="border rounded-xl px-3 py-2.5" placeholder="Nom *" [(ngModel)]="form.name">
    <input class="border rounded-xl px-3 py-2.5" placeholder="Téléphone" [(ngModel)]="form.phone">
    <input class="border rounded-xl px-3 py-2.5" placeholder="Véhicule" [(ngModel)]="form.vehicle">
    <button class="rounded-xl px-4 py-2.5 text-white bg-slate-900 hover:bg-black" (click)="add()">Ajouter</button>

    <div class="md:col-span-2">
      <input class="border rounded-xl px-3 py-2.5 w-full" placeholder="Rechercher" [(ngModel)]="q">
    </div>
  </div>

  <div class="grid gap-3">
    <div *ngFor="let c of items()" class="bg-white border rounded-2xl shadow-sm px-4 py-3 flex items-center justify-between">
      <div>
        <div class="font-medium">{{ c.firstName }} {{ c.name }}</div>
        <div class="text-sm text-slate-600">{{ c.phone || '—' }} • {{ c.vehicle || '—' }}</div>
      </div>
      <button class="text-red-600 hover:text-red-700 text-sm" (click)="remove(c.id)">Supprimer</button>
    </div>
  </div>
</section>
'@

New-Text "src/app/features/clients/clients.routes.ts" @'
import { Routes } from '@angular/router';
import { ClientsPage } from './ui/clients.page';
export const CLIENTS_ROUTES: Routes = [{ path: '', component: ClientsPage, title: 'Clients' }];
'@

# 8) Appointments feature (domain: slot-engine; ui page + routes)
New-Text "src/app/features/appointments/domain/slot-engine.ts" @'
import { toMin } from '../../../core/utils/time';
export type SlotResult = 'free'|'taken'|'unavailable';

export function windowStatus(startHHMM: string, duration: number, blocks: {time:string; duration:number;}[], dayEndHHMM='18:00'): SlotResult {
  const s = toMin(startHHMM), e = s + duration, close = toMin(dayEndHHMM);
  if (e > close) return 'unavailable';
  const overlaps = blocks.filter(b => {
    const bs = toMin(b.time), be = bs + b.duration;
    return s < be && bs < e;
  });
  if (!overlaps.length) return 'free';
  const segs = overlaps.map(b => {
    const bs = toMin(b.time), be = bs + b.duration;
    return [Math.max(s, bs), Math.min(e, be)] as [number, number];
  }).sort((a,b)=>a[0]-b[0]);
  let cov = 0, [cs, ce] = segs[0];
  for (let i=1;i<segs.length;i++){ const [x,y]=segs[i]; if (x<=ce) ce=Math.Max(ce,y); else { cov+=ce-cs; cs=x; ce=y; } }
  cov += ce - cs;
  if (cov >= duration) return 'taken';
  return 'unavailable';
}
'@ -replace 'Math.Max','Math.max' | Set-Content -Path "src/app/features/appointments/domain/slot-engine.ts" -Encoding UTF8

New-Text "src/app/features/appointments/ui/appointments.page.ts" @'
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-appointments-page',
  imports: [CommonModule],
  templateUrl: './appointments.page.html'
})
export class AppointmentsPage {}
'@

New-Text "src/app/features/appointments/ui/appointments.page.html" @'
<section class="max-w-6xl mx-auto px-4 py-6">
  <h2 class="text-2xl font-semibold mb-3">Rendez-vous</h2>
  <div class="bg-white rounded-2xl border shadow-sm p-4">À implémenter : filtre, liste, slot-picker…</div>
</section>
'@

New-Text "src/app/features/appointments/appointments.routes.ts" @'
import { Routes } from '@angular/router';
import { AppointmentsPage } from './ui/appointments.page';
export const APPOINTMENTS_ROUTES: Routes = [{ path: '', component: AppointmentsPage, title: 'Rendez-vous' }];
'@

# 9) Routes racine + bootstrap
New-Text "src/app/app.routes.ts" @'
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES) },
  { path: 'clients', loadChildren: () => import('./features/clients/clients.routes').then(m => m.CLIENTS_ROUTES) },
  { path: 'rendez-vous', loadChildren: () => import('./features/appointments/appointments.routes').then(m => m.APPOINTMENTS_ROUTES) },
  { path: '**', redirectTo: 'dashboard' }
];
'@

# 10) Petit layout de base dans app.component.html si besoin
if (Test-Path "src/app/app.html") {
  Add-Content "src/app/app.html" "`n<!-- Routes -->`n<router-outlet></router-outlet>`n"
}
Write-Host "✅ Structure créée. Lance:  ng serve"
