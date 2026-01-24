import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { AppointmentsService } from '../../services/appointments.service';
import { Appointment } from '../../models/appointment.model';
import { I18nService } from '../../services/i18n.service';
import { SlotPickerComponent } from '../../components/slot-picker/slot-picker.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, SlotPickerComponent],
  templateUrl: './dashboard.component.html',
})
export class DashboardComponent implements OnInit {
  // --- État ---
  date: string = this.today();
  dateObj: Date = new Date();
  duration: number = 30; // Durée par défaut pour l'affichage
  items: Appointment[] = [];
  isLoading = false;
  showSlots = true;

  private readonly appointmentsSvc = inject(AppointmentsService);
  public readonly i18n = inject(I18nService);

  ngOnInit(): void {
    this.loadAppointments();
  }

  // --- Navigation jours ---
  prevDay(): void {
    this.setDate(this.shift(this.date, -1));
  }

  nextDay(): void {
    this.setDate(this.shift(this.date, +1));
  }

  goToday(): void {
    this.setDate(this.today());
  }

  setDate(value: string): void {
    if (!value) return;
    this.date = value;
    this.dateObj = new Date(value + 'T00:00:00');
    this.loadAppointments();
  }

  // --- Chargement ---
  loadAppointments(): void {
    this.isLoading = true;
    this.appointmentsSvc.listByDate(this.date).subscribe({
      next: (data) => {
        this.items = data ?? [];
        this.isLoading = false;
        // Force refresh des slots
        this.showSlots = false;
        setTimeout(() => this.showSlots = true, 0);
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
        this.items = [];
      },
    });
  }

  // --- Utils dates ---
  private today(): string {
    const d = new Date();
    return this.formatDate(d);
  }

  private formatDate(d: Date): string {
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private shift(isoDate: string, days: number): string {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }
}
