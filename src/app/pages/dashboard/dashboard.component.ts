import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, lastValueFrom, map } from 'rxjs';

import { Appointment } from '../../models/appointment.model';
import { Client } from '../../models/client.model';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';

type SlotState = 'free' | 'busy' | 'past';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  imports: [CommonModule, FormsModule, NgIf, NgFor],
  templateUrl: './dashboard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardComponent implements OnInit {
  // ----- UI -----
  date: string = new Date().toISOString().slice(0, 10);
  loading = false;
  deletingId: number | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  tempSlots: any[] = []; // pour reset visuel avant nouveau chargement

  // ----- Données -----
  items: Appointment[] = [];
  private clientsById = new Map<number, Client>();

  // paramètres de la grille
  readonly step = 15;
  readonly startHour = 8;
  readonly endHour = 18;

  constructor(
    private appts: AppointmentsService,
    private clientsApi: ClientsService
  ) {}

  async ngOnInit() {
    await this.refresh();
  }

  // ----- Navigation fluide -----
  private resetView() {
    this.items = [];
    this.tempSlots = [];
  }

  async prevDay() {
    const d = new Date(this.date);
    d.setDate(d.getDate() - 1);
    this.date = d.toISOString().slice(0, 10);
    this.triggerRefresh();
  }

  async nextDay() {
    const d = new Date(this.date);
    d.setDate(d.getDate() + 1);
    this.date = d.toISOString().slice(0, 10);
    this.triggerRefresh();
  }

  async today() {
    this.date = new Date().toISOString().slice(0, 10);
    this.triggerRefresh();
  }

  async setDate(newDate: string) {
    this.date = newDate;
    this.triggerRefresh();
  }

  private triggerRefresh() {
    this.resetView();
    this.loading = true;

    // petit délai pour laisser Angular réafficher le reset
    setTimeout(async () => {
      await this.refresh();
      this.loading = false;
    }, 150);
  }

  // ----- Chargement des données -----
  private cacheClients(list: Client[] = []) {
    this.clientsById.clear();
    for (const c of list || []) this.clientsById.set(Number((c as any).id), c);
  }

  private nameOf(id?: number | string): string | undefined {
    const c = this.clientsById.get(Number(id));
    if (!c) return undefined;
    const full = `${c.firstName ?? ''} ${c.name ?? ''}`.trim();
    return full || undefined;
  }

  async refresh() {
    this.loading = true;
    try {
      this.items = await lastValueFrom(this.appts.listByDate(this.date));
    } finally {
      this.loading = false;
    }
  }


  // ----- Suppression -----
  async remove(appt: Appointment) {
    if (!appt.id) return;
    const ok = confirm(`Supprimer le rendez-vous de ${appt.clientName ?? 'client'} à ${appt.time} (pont ${appt.bay}) ?`);
    if (!ok) return;
    this.deletingId = appt.id;
    try {
      // @ts-ignore
      await lastValueFrom(this.appts.delete(appt.id));
      await this.refresh();
    } finally {
      this.deletingId = null;
    }
  }

  // ----- Vue Liste -----
  endTime(time: string, duration?: number): string {
    const [h, m] = time.split(':').map(Number);
    const d = duration ?? 30;
    const total = h * 60 + m + d;
    const hh = Math.floor(total / 60);
    const mm = total % 60;
    return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  }

  listA(): Appointment[] {
    return this.items.filter(a => a.bay === 'A');
  }

  listB(): Appointment[] {
    return this.items.filter(a => a.bay === 'B');
  }

  // ----- Vue Grille -----
  private isPastMinute(minOfDay: number): boolean {
    const todayStr = new Date().toISOString().slice(0, 10);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    return this.date === todayStr && minOfDay < nowMin;
  }

  private findAppt(bay: 'A' | 'B', time: string): Appointment | undefined {
    return this.items.find(a => a.bay === bay && a.time === time);
  }

  slots(bay: 'A' | 'B'): { time: string; state: SlotState; appt?: Appointment }[] {
    const res: { time: string; state: SlotState; appt?: Appointment }[] = [];
    for (let h = this.startHour; h < this.endHour; h++) {
      for (let m = 0; m < 60; m += this.step) {
        const time = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        const min = h * 60 + m;
        const appt = this.findAppt(bay, time);
        let state: SlotState = 'free';
        if (this.isPastMinute(min)) state = 'past';
        else if (appt) state = 'busy';
        res.push({ time, state, appt });
      }
    }
    return res;
  }
}
