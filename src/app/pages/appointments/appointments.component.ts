import { Component, OnInit, ChangeDetectorRef, ViewChildren, QueryList, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { lastValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import { I18nService } from '../../services/i18n.service';

import { Appointment, AppointmentRequest, AppointmentResponse } from '../../models/appointment.model';
import { Client } from '../../models/client.model';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';
import { SlotPickerComponent } from '../../components/slot-picker/slot-picker.component';

@Component({
  standalone: true,
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  imports: [CommonModule, FormsModule, NgIf, NgFor, UpperCasePipe, SlotPickerComponent]
})
export class AppointmentsComponent implements OnInit {
  // On initialise dans ngOnInit pour garantir qu'on utilise la date locale
  date: string = '';
  duration = 30;
  durations = [15, 30, 45, 60];
  // force (dé)montage des slot-pickers via *ngIf
  showSlots = true;

  // Getter pour le template - convertit la date string en Date object
  get dateObj(): Date {
    return this.parseDate(this.date);
  }

  // --- helpers date locale (évite toISOString/UTC) ---
  private pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private parseDate(s: string): Date {
    const [y, m, day] = (s || '').split('-').map(Number);
    // new Date(year, monthIndex, day) crée une date en heure locale
    return new Date(y, (m || 1) - 1, day || 1);
  }

  items: Appointment[] = [];

  clients: Client[] = [];
  private clientsById = new Map<number, Client>();
  selectedClient: Client | null = null;
  showClientPicker = false;
  clientSearch = '';

  serviceType = '';
  showServiceError = false;

  isLoading = false;

  // 🔎 Référence sur les 2 enfants pour forcer un rebuild manuel
  @ViewChildren(SlotPickerComponent) private pickers!: QueryList<SlotPickerComponent>;

  private appts = inject(AppointmentsService);
  private clientsApi = inject(ClientsService);
  private toastr = inject(ToastrService);
  public i18n = inject(I18nService);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit(): Promise<void> {
    // initialiser la date en heure locale pour éviter le décalage UTC
    this.date = this.formatDate(new Date());

    await this.refresh();
    await this.refreshClients();
  }

  /** 🔧 Rebuild impératif des 2 SlotPicker */
  private rebuildChildren(): void {
    // On attend que l’UI intègre la nouvelle ref, puis on force
    queueMicrotask(() => {
      this.pickers?.forEach(p => p.rebuild());
    });
  }

  async refresh(): Promise<void> {
    this.isLoading = true;
    try {
      const items = await lastValueFrom(this.appts.listByDate(this.date));

      // tri + nouvelle référence
      this.items = [...(items ?? [])].sort((a, b) => a.time.localeCompare(b.time));

      this.cdr.markForCheck();
      this.rebuildChildren();

    } catch (err) {
      console.error('Erreur lors du refresh', err);
      this.toastr.error(this.i18n.t('errors.loadAppointments'), 'Erreur réseau');
      this.items = [];
      this.cdr.markForCheck();
      this.rebuildChildren();
    } finally {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  async refreshClients(): Promise<void> {
    try {
      const data = await lastValueFrom(
        this.clientsApi.listFiltered(this.clientSearch, 1, 10)
      );
      this.clients = data.items;
      this.clientsById.clear();
      data.items.forEach(client => this.clientsById.set(client.id, client));
    } catch (err) {
      console.error('Erreur lors du chargement des clients', err);
      this.toastr.error(this.i18n.t('errors.loadAppointments'), 'Erreur réseau');
      this.clients = [];
      this.clientsById.clear();
    }
  }


  // === Navigation jours ===
  async prevDay() {
    const d = this.parseDate(this.date);
    d.setDate(d.getDate() - 1);
    this.date = this.formatDate(d);

    this.items = [];            // vide → feedback immédiat
    this.cdr.detectChanges();
    this.rebuildChildren();

    this.isLoading = true;
    try {
      await this.refresh();
    } finally {
      this.isLoading = false;
    }
  }

  async nextDay() {
    const d = this.parseDate(this.date);
    d.setDate(d.getDate() + 1);
    this.date = this.formatDate(d);

    this.items = [];
    this.cdr.detectChanges();
    this.rebuildChildren();

    this.isLoading = true;
    try {
      await this.refresh();
    } finally {
      this.isLoading = false;
    }
  }

  async setDate(newDate: string) {
    this.date = newDate;

    this.items = [];
    this.cdr.detectChanges();
    this.rebuildChildren();

    this.isLoading = true;
    try {
      await this.refresh();
    } finally {
      this.isLoading = false;
    }
  }

  setDuration(d: number) {
    this.duration = d;
    // Si tu veux que changer la durée rerende aussi:
    this.rebuildChildren();
  }

  get filteredClients(): Client[] {
    const q = (this.clientSearch || '').toLowerCase().trim();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      `${c.firstName ?? ''} ${c.name ?? ''}`.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  }

  pickClient(c: Client) {
    this.selectedClient = c;
    this.showClientPicker = false;
  }

  clearClient() {
    this.selectedClient = null;
  }

  fullName(c: Client | null): string {
    if (!c) return '';
    return `${c.firstName ?? ''} ${c.name ?? ''}`.trim();
  }

  initialsOf(c: Client | null): string {
    if (!c) return '';
    const f = (c.firstName ?? '').trim();
    const n = (c.name ?? '').trim();
    return `${f.charAt(0)}${n.charAt(0)}`.toUpperCase();
  }

  get clientValid(): boolean { return !!this.selectedClient; }
  get serviceValid(): boolean { return !!this.serviceType?.trim(); }
  get canBook(): boolean { return this.clientValid && this.serviceValid && !this.isLoading; }

  async onPickA(time: string) { await this.createFor('A', time); }
  async onPickB(time: string) { await this.createFor('B', time); }

  private async createFor(bay: 'A' | 'B', time: string) {
    // Bloquer si déjà en cours de chargement
    if (this.isLoading) {
      return;
    }

    if (!this.selectedClient) {
      this.toastr.warning(this.i18n.t('appointments.toasts.chooseClientBefore'));
      return;
    }
    if (!this.serviceValid) {
      this.showServiceError = true;
      this.toastr.warning(this.i18n.t('appointments.toasts.serviceRequired'));
      return;
    }

    this.isLoading = true;

    const a: AppointmentRequest = {
      date: this.date,
      time,
      duration: this.duration,
      bay,
      clientId: Number(this.selectedClient.id),
      serviceType: this.serviceType.trim()
    };

    try {
      await lastValueFrom(this.appts.create(a));
      await this.refresh();
      this.toastr.success(this.i18n.t('appointments.toasts.booked', { time, bay }), this.i18n.t('appointments.toasts.bookedTitle'));
    } catch {
      this.toastr.error(this.i18n.t('appointments.toasts.bookError'), 'Erreur réseau');
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onBlocked(reason: 'service' | 'client' | 'both') {
    if (reason === 'both') {
      this.toastr.warning(this.i18n.t('appointments.toasts.bothRequired'));
    } else if (reason === 'client') {
      this.toastr.warning(this.i18n.t('appointments.toasts.chooseClientBefore'));
    } else {
      this.toastr.warning(this.i18n.t('appointments.toasts.serviceRequired'));
    }
  }

  async onDeleteAppointment(appointmentId: number) {
    if (this.isLoading) return;

    const confirmMessage = this.i18n.t('appointments.confirmDelete') || 'Voulez-vous vraiment supprimer ce rendez-vous ?';
    if (!confirm(confirmMessage)) return;

    this.isLoading = true;

    try {
      await lastValueFrom(this.appts.remove(appointmentId));
      await this.refresh();
      this.toastr.success(
        this.i18n.t('appointments.toasts.deleted') || 'Rendez-vous supprimé',
        this.i18n.t('appointments.toasts.deletedTitle') || 'Suppression'
      );
    } catch {
      this.toastr.error(
        this.i18n.t('appointments.toasts.deleteError') || 'Impossible de supprimer le rendez-vous',
        'Erreur'
      );
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  onClientSearchChange(): void {
    this.refreshClients();
  }
}
