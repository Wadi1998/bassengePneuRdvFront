import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/appointment.model';
import { I18nService } from '../../services/i18n.service';
import { AuthService } from '../../services/auth.service';

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

  private readonly appointmentsSvc = inject(AppointmentsService);
  public i18n = inject(I18nService);
  private auth = inject(AuthService);

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
    return `${who}${s} → ${e} - ` + itv.appt.serviceType;
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

  // Exporter les rendez-vous du jour affiché
  async exportPdfForDate(): Promise<void> {
    this.loading = true;
    try {
      const results = await firstValueFrom(this.appointmentsSvc.listByDate(this.date));
      const all = (results ?? []).slice();
      all.sort((a, b) => {
        const da = (a.date ?? '') + 'T' + (a.time ?? '00:00');
        const db = (b.date ?? '') + 'T' + (b.time ?? '00:00');
        return da.localeCompare(db);
      });
      const title = this.i18n.t('dashboard.exportTitle') + ` ${this.date}`;
      await this.generatePdf(all, String(title), `rdvs_${this.date}.pdf`);
    } catch (err) {
      console.error(err);
      alert(this.i18n.t('dashboard.exportError'));
    } finally {
      this.loading = false;
    }
  }

  // Génère et télécharge un PDF à partir d'une liste d'appointments
  private async generatePdf(all: Appointment[], title: string, filename: string): Promise<void> {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });

    doc.setFontSize(14);
    doc.text(title, 40, 40);

    doc.setFontSize(10);
    let y = 70;
    const lineHeight = 14;

    if (all.length === 0) {
      doc.text(this.i18n.t('dashboard.exportNoAppointments'), 40, y);
    } else {
      for (const a of all) {
        const line = this.appointmentLine(a);
        const wrapped = doc.splitTextToSize(line, 520);
        for (const l of wrapped) {
          if (y > 800) {
            doc.addPage();
            y = 40;
          }
          doc.text(l, 40, y);
          y += lineHeight;
        }
        y += 4;
      }
    }

    doc.save(filename);
  }

  // Helper: format ligne de RDV
  private appointmentLine(a: Appointment): string {
    const date = a.date ?? '';
    const time = a.time ?? '';
    const bay = a.bay ? `(${a.bay}) ` : '';
    const who = a.clientName ? `${a.clientName} • ` : '';
    const service = a.serviceType ?? '';
    const dur = a.duration ? `${a.duration}m` : '';
    return `${date} ${time} ${bay}${who}${service} ${dur}`.trim();
  }
}
