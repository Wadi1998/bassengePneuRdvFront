import { Component, OnInit, ChangeDetectorRef, ViewChildren, QueryList } from '@angular/core';
import { CommonModule, NgFor, NgIf, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, lastValueFrom } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { Appointment } from '../../models/appointment.model';
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
  date: string = new Date().toISOString().slice(0, 10);
  duration = 30;
  durations = [15, 30, 45, 60];
  // force (dé)montage des slot-pickers via *ngIf
  showSlots = true;


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

  constructor(
    private appts: AppointmentsService,
    private clientsApi: ClientsService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
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
    try {
      const items = await lastValueFrom(this.appts.listByDate(this.date));

      // tri + nouvelle référence
      this.items = [...(items ?? [])].sort((a, b) => a.time.localeCompare(b.time));

      this.cdr.markForCheck();
      this.rebuildChildren();

    } catch (err) {
      console.error('Erreur lors du refresh', err);
      this.toastr.error('Erreur lors du chargement des rendez-vous.', 'Erreur réseau');
      this.items = [];
      this.cdr.markForCheck();
      this.rebuildChildren();

    } finally {
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
      this.toastr.error('Erreur lors du chargement des clients.', 'Erreur réseau');
      this.clients = [];
      this.clientsById.clear();
    }
  }


  // === Navigation jours ===
  async prevDay() {
    const d = new Date(this.date);
    d.setDate(d.getDate() - 1);
    this.date = d.toISOString().slice(0, 10);

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
    const d = new Date(this.date);
    d.setDate(d.getDate() + 1);
    this.date = d.toISOString().slice(0, 10);

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
      (c.phone ?? '').toLowerCase().includes(q) ||
      (c.vehicle ?? '').toLowerCase().includes(q)
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
  get canBook(): boolean { return this.clientValid && this.serviceValid; }

  async onPickA(time: string) { await this.createFor('A', time); }
  async onPickB(time: string) { await this.createFor('B', time); }

  private async createFor(bay: 'A' | 'B', time: string) {
    if (!this.selectedClient) {
      this.toastr.warning('Choisis un client avant de réserver.');
      return;
    }
    if (!this.serviceValid) {
      this.showServiceError = true;
      this.toastr.warning('Saisis un type de service avant de réserver.');
      return;
    }

    const a: Appointment = {
      date: this.date,
      time,
      duration: this.duration,
      bay,
      clientId: Number(this.selectedClient.id),
      clientName: this.fullName(this.selectedClient),
      serviceType: this.serviceType.trim()
    };

    try {
      await lastValueFrom(this.appts.create(a));
      await this.refresh();
      this.toastr.success(`Réservé à ${time} sur pont ${bay}`, 'Rendez-vous créé');
    } catch {
      this.toastr.error('Impossible de créer le rendez-vous.', 'Erreur réseau');
    }
  }

  onBlocked(reason: 'service' | 'client' | 'both') {
    if (reason === 'both') {
      this.toastr.warning('Choisis un client et un type de service avant de réserver.');
    } else if (reason === 'client') {
      this.toastr.warning('Choisis un client avant de réserver.');
    } else {
      this.toastr.warning('Saisis un type de service avant de réserver.');
    }
  }

  onClientSearchChange(): void {
    this.refreshClients();
  }
}
