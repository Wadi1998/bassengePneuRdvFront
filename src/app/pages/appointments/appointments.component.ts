import { Component, OnInit, ChangeDetectorRef, ViewChildren, QueryList, inject, OnDestroy } from '@angular/core';
import { CommonModule, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil, lastValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { I18nService } from '../../services/i18n.service';
import { Appointment, AppointmentRequest } from '../../models/appointment.model';
import { Client } from '../../models/client.model';
import { CarResponse } from '../../models/car.model';
import { AppointmentsService } from '../../services/appointments.service';
import { ClientsService } from '../../services/clients.service';
import { CarsService } from '../../services/cars.service';
import { SlotPickerComponent } from '../../components/slot-picker/slot-picker.component';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../components/confirm-dialog/confirm-dialog.component';

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  standalone: true,
  selector: 'app-appointments',
  templateUrl: './appointments.component.html',
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    NgIf,
    NgFor,
    UpperCasePipe,
    SlotPickerComponent,
    ConfirmDialogComponent
  ]
})
export class AppointmentsComponent implements OnInit, OnDestroy {
  // ═══════════════════════════════════════════════════════════════════════════
  // Injections
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly appts = inject(AppointmentsService);
  private readonly clientsApi = inject(ClientsService);
  private readonly carsApi = inject(CarsService);
  private readonly toastr = inject(ToastrService);
  private readonly cdr = inject(ChangeDetectorRef);
  public readonly i18n = inject(I18nService);

  // ═══════════════════════════════════════════════════════════════════════════
  // État du composant
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly destroy$ = new Subject<void>();

  // Date et durée
  date = '';
  duration = 30;
  readonly durations = [15, 30, 45, 60];
  showSlots = true;

  // Rendez-vous
  items: Appointment[] = [];

  // Clients
  clients: Client[] = [];
  private clientsById = new Map<number, Client>();
  selectedClient: Client | null = null;
  showClientPicker = false;
  clientSearch = '';

  // Voitures
  clientCars: CarResponse[] = [];
  selectedCar: CarResponse | null = null;
  showCarPicker = false;
  isLoadingCars = false;

  // Service
  serviceType = '';
  showServiceError = false;

  // États UI
  isLoading = false;

  // Modal de confirmation pour suppression
  isConfirmOpen = false;
  confirmData: ConfirmDialogData | null = null;
  private pendingDeleteId: number | null = null;

  // Modal de confirmation pour création
  isCreateConfirmOpen = false;
  createConfirmData: ConfirmDialogData | null = null;
  private pendingCreate: { bay: 'A' | 'B', time: string } | null = null;

  // Références aux slot-pickers
  @ViewChildren(SlotPickerComponent) private pickers!: QueryList<SlotPickerComponent>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Getters
  // ═══════════════════════════════════════════════════════════════════════════
  get dateObj(): Date {
    return this.parseDate(this.date);
  }

  get filteredClients(): Client[] {
    const q = (this.clientSearch || '').toLowerCase().trim();
    if (!q) return this.clients;
    return this.clients.filter(c =>
      `${c.firstName ?? ''} ${c.name ?? ''}`.toLowerCase().includes(q) ||
      (c.phone ?? '').toLowerCase().includes(q)
    );
  }

  get clientValid(): boolean {
    return !!this.selectedClient;
  }

  get carValid(): boolean {
    return !!this.selectedCar || this.clientCars.length === 0;
  }

  get serviceValid(): boolean {
    return !!this.serviceType?.trim();
  }

  get canBook(): boolean {
    return this.clientValid && this.carValid && this.serviceValid && !this.isLoading;
  }

  /** Nombre de RDV du jour */
  get todayCount(): number {
    return this.items.length;
  }

  /** Durée totale des RDV du jour en minutes */
  get totalMinutes(): number {
    return this.items.reduce((sum, item) => sum + (item.duration || 0), 0);
  }

  /** Vérifie si la date sélectionnée est aujourd'hui */
  get isToday(): boolean {
    return this.date === this.formatDate(new Date());
  }

  /** Vérifie si la date sélectionnée est dans le passé */
  get isPastDate(): boolean {
    const today = this.formatDate(new Date());
    return this.date < today;
  }

  /** Date minimale pour le sélecteur (aujourd'hui) */
  get minDate(): string {
    return this.formatDate(new Date());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════
  async ngOnInit(): Promise<void> {
    this.date = this.formatDate(new Date());
    await this.refresh();
    await this.refreshClients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers de date
  // ═══════════════════════════════════════════════════════════════════════════
  private pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${this.pad(d.getMonth() + 1)}-${this.pad(d.getDate())}`;
  }

  private parseDate(s: string): Date {
    const [y, m, day] = (s || '').split('-').map(Number);
    return new Date(y, (m || 1) - 1, day || 1);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Chargement des données
  // ═══════════════════════════════════════════════════════════════════════════
  async refresh(): Promise<void> {
    this.isLoading = true;
    try {
      const items = await lastValueFrom(this.appts.listByDate(this.date));
      this.items = [...(items ?? [])].sort((a, b) => a.time.localeCompare(b.time));
      this.cdr.markForCheck();
      this.rebuildChildren();
    } catch (err) {
      console.error('Erreur lors du refresh', err);
      this.toastr.error(this.i18n.t('errors.loadAppointments'));
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
      this.clients = data.content;
      this.clientsById.clear();
      data.content.forEach((client: Client) => this.clientsById.set(client.id, client));
    } catch (err) {
      console.error('Erreur lors du chargement des clients', err);
      this.toastr.error(this.i18n.t('errors.loadClients'));
      this.clients = [];
      this.clientsById.clear();
    }
  }

  private rebuildChildren(): void {
    queueMicrotask(() => {
      this.pickers?.forEach(p => p.rebuild());
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Navigation
  // ═══════════════════════════════════════════════════════════════════════════
  async prevDay(): Promise<void> {
    const d = this.parseDate(this.date);
    d.setDate(d.getDate() - 1);
    this.date = this.formatDate(d);
    await this.handleDateChange();
  }

  async nextDay(): Promise<void> {
    const d = this.parseDate(this.date);
    d.setDate(d.getDate() + 1);
    this.date = this.formatDate(d);
    await this.handleDateChange();
  }

  async goToday(): Promise<void> {
    this.date = this.formatDate(new Date());
    await this.handleDateChange();
  }

  async setDate(newDate: string): Promise<void> {
    this.date = newDate;
    await this.handleDateChange();
  }

  private async handleDateChange(): Promise<void> {
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

  setDuration(d: number): void {
    this.duration = d;
    this.rebuildChildren();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gestion des clients
  // ═══════════════════════════════════════════════════════════════════════════
  async pickClient(c: Client): Promise<void> {
    this.selectedClient = c;
    this.showClientPicker = false;
    this.selectedCar = null;
    this.clientCars = [];

    await this.loadClientCars(c.id);

    if (this.clientCars.length === 1) {
      this.selectedCar = this.clientCars[0];
    } else if (this.clientCars.length > 1) {
      this.showCarPicker = true;
    }
  }

  async loadClientCars(clientId: number): Promise<void> {
    this.isLoadingCars = true;
    try {
      this.clientCars = await lastValueFrom(this.carsApi.getByClientId(clientId));
    } catch (err) {
      console.error('Erreur lors du chargement des voitures', err);
      this.clientCars = [];
    } finally {
      this.isLoadingCars = false;
      this.cdr.markForCheck();
    }
  }

  pickCar(car: CarResponse): void {
    this.selectedCar = car;
    this.showCarPicker = false;
  }

  clearCar(): void {
    this.selectedCar = null;
  }

  clearClient(): void {
    this.selectedClient = null;
    this.selectedCar = null;
    this.clientCars = [];
  }

  onClientSearchChange(): void {
    this.refreshClients();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers d'affichage
  // ═══════════════════════════════════════════════════════════════════════════
  formatCarInfo(car: CarResponse | null): string {
    if (!car) return '';
    const parts = [car.brand, car.model];
    if (car.licensePlate) parts.push(`(${car.licensePlate})`);
    return parts.filter(Boolean).join(' ');
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Création de rendez-vous
  // ═══════════════════════════════════════════════════════════════════════════
  async onPickA(time: string): Promise<void> {
    await this.createFor('A', time);
  }

  async onPickB(time: string): Promise<void> {
    await this.createFor('B', time);
  }

  private async createFor(bay: 'A' | 'B', time: string): Promise<void> {
    if (this.isLoading) return;

    // Vérifier si la date est dans le passé
    if (this.isPastDate) {
      this.toastr.error('Impossible de prendre un rendez-vous sur une date passée');
      return;
    }

    if (!this.selectedClient) {
      this.toastr.warning(this.i18n.t('appointments.toasts.chooseClientBefore'));
      return;
    }

    if (this.clientCars.length > 0 && !this.selectedCar) {
      this.toastr.warning(this.i18n.t('appointments.toasts.chooseCarBefore'));
      return;
    }

    if (!this.serviceValid) {
      this.showServiceError = true;
      this.toastr.warning(this.i18n.t('appointments.toasts.serviceRequired'));
      return;
    }

    // Demander confirmation avant de créer le rendez-vous
    this.pendingCreate = { bay, time };
    const carInfo = this.selectedCar ? this.formatCarInfo(this.selectedCar) : 'Aucune voiture';
    const dateFormatted = this.dateObj.toLocaleDateString('fr-BE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    this.createConfirmData = {
      title: 'Confirmer le rendez-vous',
      message: `
📋 Client: ${this.fullName(this.selectedClient)}

🚗 Voiture: ${carInfo}

🔧 Service: ${this.serviceType}

📅 Date: ${dateFormatted}

⏰ Heure: ${time}

⏱️ Durée: ${this.duration} minutes

🏗️ Pont: ${bay}
      `.trim(),
      confirmText: 'Confirmer',
      cancelText: 'Annuler',
      type: 'info'
    };
    this.isCreateConfirmOpen = true;
  }

  async onConfirmCreate(): Promise<void> {
    this.isCreateConfirmOpen = false;

    if (!this.pendingCreate || !this.selectedClient) return;

    const { bay, time } = this.pendingCreate;
    this.isLoading = true;

    const request: AppointmentRequest = {
      date: this.date,
      time,
      duration: this.duration,
      bay,
      clientId: Number(this.selectedClient.id),
      carId: this.selectedCar?.id,
      serviceType: this.serviceType.trim()
    };

    try {
      await lastValueFrom(this.appts.create(request));
      await this.refresh();

      // Réinitialiser le formulaire après succès
      this.serviceType = '';
      this.showServiceError = false;

      // Scroll vers le haut pour voir le rendez-vous créé
      window.scrollTo({ top: 0, behavior: 'smooth' });

      this.toastr.success(
        this.i18n.t('appointments.toasts.booked', { time, bay }),
        this.i18n.t('appointments.toasts.bookedTitle')
      );
    } catch {
      this.toastr.error(this.i18n.t('appointments.toasts.bookError'));
      this.isLoading = false;
      this.cdr.markForCheck();
    } finally {
      this.pendingCreate = null;
    }
  }

  onCancelCreate(): void {
    this.isCreateConfirmOpen = false;
    this.pendingCreate = null;
  }

  onBlocked(reason: 'service' | 'client' | 'both'): void {
    if (reason === 'both') {
      this.toastr.warning(this.i18n.t('appointments.toasts.bothRequired'));
    } else if (reason === 'client') {
      this.toastr.warning(this.i18n.t('appointments.toasts.chooseClientBefore'));
    } else {
      this.toastr.warning(this.i18n.t('appointments.toasts.serviceRequired'));
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Suppression de rendez-vous (avec modal custom)
  // ═══════════════════════════════════════════════════════════════════════════
  onDeleteAppointment(appointmentId: number): void {
    if (this.isLoading) return;

    this.pendingDeleteId = appointmentId;
    this.confirmData = {
      title: this.i18n.t('appointments.deleteAppointment'),
      message: this.i18n.t('appointments.confirmDelete'),
      confirmText: this.i18n.t('clients.removeButton'),
      cancelText: this.i18n.t('clients.cancel'),
      type: 'danger'
    };
    this.isConfirmOpen = true;
  }

  async onConfirmDelete(): Promise<void> {
    this.isConfirmOpen = false;

    if (!this.pendingDeleteId) return;

    this.isLoading = true;

    try {
      await lastValueFrom(this.appts.remove(this.pendingDeleteId));
      await this.refresh();
      this.toastr.success(
        this.i18n.t('appointments.toasts.deleted'),
        this.i18n.t('appointments.toasts.deletedTitle')
      );
    } catch {
      this.toastr.error(this.i18n.t('appointments.toasts.deleteError'));
      this.isLoading = false;
      this.cdr.markForCheck();
    } finally {
      this.pendingDeleteId = null;
    }
  }

  onCancelDelete(): void {
    this.isConfirmOpen = false;
    this.pendingDeleteId = null;
  }
}
