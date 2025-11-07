import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/appointment.model';
import { I18nService } from '../../services/i18n.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { jsPDF } from 'jspdf';

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

  // ajout export
  exportFrom: string = this.today();
  exportTo: string = this.today();
  exportLoading = false;
  exportError: string | null = null;

  // grille des HH:mm
  times: string[] = [];

  // RDV du jour
  appointments: Appointment[] = [];

  // intervalles occupés par baie
  private intervalsByBay: Record<Bay, Interval[]> = { A: [], B: [] };

  private readonly appointmentsSvc = inject(AppointmentsService);
  public i18n = inject(I18nService);

  // --- helpers date locale ---
  private pad(n: number): string { return n < 10 ? `0${n}` : `${n}`; }
  private formatDateLocal(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

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
    return this.formatDateLocal(new Date());
  }

  private shift(isoDate: string, days: number): string {
    // isoDate expected format: YYYY-MM-DD
    const parts = (isoDate || '').split('-').map(Number);
    if (parts.length !== 3) return isoDate;
    const [y, m, dd] = parts;
    const d = new Date(y, (m || 1) - 1, dd || 1);
    d.setDate(d.getDate() + days);
    return this.formatDateLocal(d);
  }

  private isPast(time: string): boolean {
    // Parse date (YYYY-MM-DD) and time (HH:mm) and compare in locale
    const dateParts = (this.date || '').split('-').map(Number);
    const timeParts = (time || '00:00').split(':').map(Number);
    if (dateParts.length !== 3) return false;
    const [y, m, d] = dateParts;
    const [h, min] = timeParts;
    const slot = new Date(y, (m || 1) - 1, d || 1, h || 0, min || 0, 0);
    const todayStr = this.today();
    if (this.date < todayStr) return true;
    if (this.date > todayStr) return false;
    return slot.getTime() < Date.now();
  }

  // Renvoie toutes les dates ISO (YYYY-MM-DD) entre start et end inclus
  private datesBetween(startIso: string, endIso: string): string[] {
    const startParts = startIso.split('-').map(Number);
    const endParts = endIso.split('-').map(Number);
    if (startParts.length !== 3 || endParts.length !== 3) return [];
    const s = new Date(startParts[0], (startParts[1] || 1) - 1, startParts[2] || 1);
    const e = new Date(endParts[0], (endParts[1] || 1) - 1, endParts[2] || 1);
    if (s > e) return [];
    const out: string[] = [];
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      out.push(this.formatDateLocal(new Date(d)));
    }
    return out;
  }

  // Exporte les rendez-vous entre exportFrom et exportTo en PDF
  exportAppointments(): void {
    this.exportError = null;
    if (!this.exportFrom || !this.exportTo) {
      this.exportError = 'Veuillez sélectionner les deux dates.';
      return;
    }

    const dates = this.datesBetween(this.exportFrom, this.exportTo);
    if (dates.length === 0) {
      this.exportError = 'Plage de dates invalide (vérifiez l’ordre).';
      return;
    }
    // Limiter la plage (sécurité) à 62 jours pour éviter surcharge réseau
    if (dates.length > 62) {
      this.exportError = 'Plage trop longue, réduisez à 62 jours maximum.';
      return;
    }

    this.exportLoading = true;

    const requests = dates.map(d => this.appointmentsSvc.listByDate(d).pipe(catchError(() => of([]))));
    forkJoin(requests).subscribe({
      next: (results) => {
        // aplatir et ajouter la date de chaque élément (au cas où l'API ne renvoie pas la date)
        const all: Appointment[] = [];
        for (let i = 0; i < results.length; i++) {
          const day = dates[i];
          for (const a of (results[i] || [])) {
            // si l'objet n'a pas de date, on ajoute la date du jour
            (a as any).day = (a as any).date || day;
            all.push(a);
          }
        }
        // tri par date puis par time
        all.sort((x, y) => {
          const dx = (x as any).day || '';
          const dy = (y as any).day || '';
          if (dx < dy) return -1; if (dx > dy) return 1;
          const tx = x.time || '';
          const ty = y.time || '';
          return tx < ty ? -1 : tx > ty ? 1 : 0;
        });

        this.generatePdf(all, this.exportFrom, this.exportTo);
        this.exportLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.exportLoading = false;
        this.exportError = 'Erreur durant la récupération des rendez-vous.';
      }
    });
  }

  private generatePdf(items: Appointment[], from: string, to: string): void {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginLeft = 40;
    let y = 60;
    doc.setFontSize(16);
    doc.text(`Rendez-vous du ${from} au ${to}`, marginLeft, y);
    y += 24;
    doc.setFontSize(11);

    // en-tête tableau (sans téléphone, pas présent dans Appointment)
    const cols = ['Date', 'Heure', 'Baie', 'Client', 'Service', 'Durée'];
    const colX = [marginLeft, 110, 160, 200, 360, 460];
    doc.setFont('helvetica', 'bold');
    for (let i = 0; i < cols.length; i++) doc.text(cols[i], colX[i], y);
    doc.setFont('helvetica', 'normal');
    y += 14;
    doc.setLineWidth(0.5);
    doc.line(marginLeft, y, 560, y);
    y += 10;

    for (const a of items) {
      if (y > 750) { doc.addPage(); y = 40; }
      const day = (a as any).day || (a as any).date || '';
      doc.text(day, colX[0], y);
      doc.text(a.time || '', colX[1], y);
      doc.text(a.bay || '', colX[2], y);
      doc.text(a.clientName || '', colX[3], y, { maxWidth: 140 });
      doc.text(a.serviceType || '', colX[4], y, { maxWidth: 90 });
      doc.text((a.duration != null ? String(a.duration) + 'm' : ''), colX[5], y);
      y += 16;
    }

    doc.save(`rendezvous_${from}_to_${to}.pdf`);
  }
}
