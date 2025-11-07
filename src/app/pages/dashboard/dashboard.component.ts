import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/appointment.model';
type Bay = 'A' | 'B';

interface Interval {
  startMin: number; // minutes depuis 00:00
  endMin: number;   // start + duration
  appt: Appointment;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {

  // --- configuration créneaux (modifiable dans l'UI) ---
  stepMin = 15;                 // pas entre créneaux
  startTime = '08:00';          // heure début journée
  endTime   = '18:00';          // heure fin journée

  // --- état ---
  date: string = this.today();
  loading = false;
  error: string | null = null;

  // grille des HH:mm
  times: string[] = [];

  // RDV du jour
  appointments: Appointment[] = [];

  // intervalles occupés par baie
  private intervalsByBay: Record<Bay, Interval[]> = { A: [], B: [] };

  constructor(private readonly appointmentsSvc: AppointmentsService) {}

  ngOnInit(): void {
    this.regenTimes();
    this.loadFor(this.date);
  }

  // --- navigation jours (réactif) ---
  prevDay(): void { this.setDate(this.shift(this.date, -1)); }
  nextDay(): void { this.setDate(this.shift(this.date, +1)); }

  setDate(value: string): void {
    if (!value) return;
    this.date = value;
    this.loadFor(value);
  }

  // --- modification de la plage horaire (réactif) ---
  onChangeBounds(): void {
    this.regenTimes();
  }

  // --- chargement service ---
  private loadFor(date: string): void {
    this.loading = true;
    this.error = null;

    this.appointmentsSvc.listByDate(date).subscribe({
      next: (data) => {
        this.appointments = (data ?? []).slice();
        this.reindexIntervals();         // recalcule les intervalles occupés
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.error = 'Impossible de charger les rendez-vous.';
        this.appointments = [];
        this.intervalsByBay = { A: [], B: [] };
      },
    });
  }

  // --- indexation en intervalles occupés par baie ---
  private reindexIntervals(): void {
    const map: Record<Bay, Interval[]> = { A: [], B: [] };
    for (const a of this.appointments) {
      if (!a.time || !a.bay || !a.duration) continue;
      const startMin = this.hhmmToMin(a.time);
      const endMin = startMin + a.duration;
      map[a.bay].push({ startMin, endMin, appt: a });
    }
    // trier pour recherche plus simple
    map.A.sort((x, y) => x.startMin - y.startMin);
    map.B.sort((x, y) => x.startMin - y.startMin);
    this.intervalsByBay = map;
  }

  // --- statut d'un créneau ---
  statusOf(bay: Bay, time: string): 'past' | 'busy' | 'free' {
    // passé ?
    if (this.isPast(time)) return 'past';
    // occupé ?
    const itv = this.intervalAt(bay, time);
    if (itv) return 'busy';
    // libre
    return 'free';
  }

  // interval qui couvre ce slot (ou undefined)
  intervalAt(bay: Bay, time: string): Interval | undefined {
    const tMin = this.hhmmToMin(time);
    // un slot couvre [tMin, tMin + stepMin[
    const step = this.stepMin || 15;
    const endOfSlot = tMin + step;
    // On considère occupé si l'intervalle intersecte le slot
    return this.intervalsByBay[bay].find(i => i.startMin < endOfSlot && i.endMin > tMin);
  }

  // libellé "08:30 → 09:00" pour l'intervalle couvrant ce slot
  busyLabel(bay: Bay, time: string): string {
    const itv = this.intervalAt(bay, time);
    if (!itv) return 'Occupé';
    const s = this.minToHHmm(itv.startMin);
    const e = this.minToHHmm(itv.endMin);
    const who = itv.appt.clientName ? `${itv.appt.clientName} • ` : '';
    return `${who}${s} → ${e}`;
  }

  // --- génération de la grille des heures ---
  private regenTimes(): void {
    const start = this.hhmmToMin(this.startTime);
    const end = this.hhmmToMin(this.endTime);
    const step = this.stepMin || 15;

    const out: string[] = [];
    for (let t = start; t <= end; t += step) {
      out.push(this.minToHHmm(t));
    }
    this.times = out;
  }

  // --- utils temps & dates ---
  private hhmmToMin(hhmm: string): number {
    const [h, m] = (hhmm ?? '00:00').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
  }

  private minToHHmm(total: number): string {
    const h = Math.floor(total / 60).toString().padStart(2, '0');
    const m = (total % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private today(): string {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  }

  private shift(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  private isPast(time: string): boolean {
    const now = new Date();
    const slot = new Date(this.date + 'T' + time + ':00');
    // si la date est strictement dans le passé
    const todayIso = this.today();
    if (this.date < todayIso) return true;
    if (this.date > todayIso) return false;
    return slot.getTime() < now.getTime();
  }
}
