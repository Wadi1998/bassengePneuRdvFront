import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { bePhoneLibValidator, parsePhoneBE } from '../../utils/phone-be-lib';
import { ClientsService } from '../../services/clients.service';
import { Client } from '../../models/client.model';
import { I18nService } from '../../services/i18n.service';

@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);
  private api = inject(ClientsService);
  public i18n = inject(I18nService);

  form: FormGroup;
  items: Client[] = [];

  // 🔎 recherche
  search = new FormControl<string>('', { nonNullable: true });

  // 🎯 focus “Prénom”
  @ViewChild('firstNameInput') firstNameInput?: ElementRef<HTMLInputElement>;

  // Pagination
  page = 1;
  pageSize = 20;
  totalClient = 0;

  // Ajout des propriétés pour la gestion de la popup
  isEditPopupOpen = false;
  editForm: FormGroup;
  currentClientId: number | null = null; // Correction du type de currentClientId

  loading = false;

  get totalPages(): number {
    return Math.ceil(this.totalClient / this.pageSize);
  }

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]],
      vehicle: ['', Validators.required],
      plate: ['', Validators.required], // Champ obligatoire pour la plaque
      email: ['', [Validators.email]] // Validation uniquement si le champ n'est pas vide
    });

    // Initialisation du formulaire de modification
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]],
      vehicle: ['', Validators.required],
      plate: ['', Validators.required],
      email: ['', [Validators.email]]
    });
  }

  // ========= Lifecycle =========
  ngOnInit(): void {
    this.search.valueChanges.subscribe(() => {
      this.page = 1; // On revient à la première page lors d'une nouvelle recherche
      this.refreshList();
    });
    this.refreshList();
  }

  ngAfterViewInit(): void {
    this.focusFirstInput();
  }

  // ========= Data loading =========
  private refreshList(): void {
    this.loading = true;
    this.api.listPaged(this.page, this.pageSize).subscribe({
      next: (data) => {
        this.items = [...data.items];
        this.totalClient = data.total;
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Impossible de charger les clients.', 'Erreur réseau');
        this.loading = false;
      }
    });
  }

  // Pagination navigation
  nextPage(): void {
    if (this.page < this.totalPages) {
      this.page++;
      this.refreshList();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.refreshList();
    }
  }

  // ========= Getters / Helpers =========
  get filtered(): Client[] {
    const q = this.normalize(this.search.value);
    if (!q) return this.items;
    const match = (v: unknown) => this.normalize(String(v ?? '')).includes(q);
    return this.items.filter(c =>
      match(c.firstName) || match(c.name) || match(this.phoneDisplay(c.phone)) || match(c.vehicle)
    );
  }

  /** Affichage humain du téléphone (garde e164 si invalide) */
  phoneDisplay(e164: string | undefined): string {
    if (!e164) return '';
    const p = parsePhoneBE(e164);
    return p.isValid ? (p.national || e164) : e164;
  }

  /** Initiales sans optional chaining dans le template (évite NG8107) */
  initials(c: Client): string {
    const f = (c.firstName || '');
    const n = (c.name || '');
    const i1 = f.length > 0 ? f[0] : '';
    const i2 = n.length > 0 ? n[0] : '';
    return i1 + i2;
  }

  trackById(_: number, c: Client) { return c.id; }

  focusFirstInput = () => {
    queueMicrotask(() => this.firstNameInput?.nativeElement?.focus());
  };

  // ========= Actions =========
  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastr.error(this.i18n.t('clients.firstNameRequired'), this.i18n.t('clients.addButton'));
      return;
    }

    const { firstName, name, phone, vehicle, plate } = this.form.value as {
      firstName: string; name: string; phone: string; vehicle?: string; plate: string;
    };
    const parsed = parsePhoneBE(phone);

    if (!parsed.isValid) {
      this.form.get('phone')?.setErrors({ bePhone: true });
      this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.addButton'));
      return;
    }

    const dto: Omit<Client, 'id'> = {
      firstName: String(firstName).trim(),
      name: String(name).trim(),
      phone: parsed.e164,
      vehicle: String(vehicle || '').trim() || undefined,
      plate: String(plate || '').trim() // Ajout du champ 'plate'
    };

    this.api.create(dto).subscribe({
      next: (created) => {
        // on insère en tête pour feedback instantané
        this.items = [created, ...this.items];
        this.toastr.success(this.i18n.t('clients.clientCount', { count: 1 }), `${created.firstName} ${created.name}`);

        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.focusFirstInput();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.i18n.t('errors.loadAppointments'), this.i18n.t('clients.addButton'));
      }
    });
  }

  remove(id: Client['id']): void {
    const c = this.items.find(x => x.id === id);
    const label = c ? `${c.firstName} ${c.name}` : this.i18n.t('clients.removeButton');
    if (!confirm(this.i18n.t('clients.removeButton') + ' ' + label + ' ?')) return;

    this.api.remove(id).subscribe({
      next: () => {
        this.items = this.items.filter(x => x.id !== id);
        this.toastr.info(this.i18n.t('clients.removeButton'));
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.i18n.t('errors.loadAppointments'));
      }
    });
  }

  openEditPopup(client: Client) {
    this.isEditPopupOpen = true;
    this.currentClientId = client.id; // client.id est de type number
    this.editForm.patchValue({
      firstName: client.firstName,
      name: client.name,
      phone: client.phone,
      vehicle: client.vehicle ?? '',
      plate: client.plate ?? '',
      email: client.email ?? ''
    });
  }

  closeEditPopup() {
    this.isEditPopupOpen = false;
    this.currentClientId = null;
  }

  updateClient() {
    if (this.editForm.invalid || this.currentClientId === null) {
      this.editForm.markAllAsTouched();
      return;
    }

    const { firstName, name, phone, vehicle, plate, email } = this.editForm.value as {
      firstName: string; name: string; phone: string; vehicle?: string; plate: string; email?: string
    };

    const parsed = parsePhoneBE(phone);
    if (!parsed.isValid) {
      this.editForm.get('phone')?.setErrors({ bePhone: true });
      this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.save'));
      return;
    }

    const dto: Omit<Client, 'id'> = {
      firstName: String(firstName).trim(),
      name: String(name).trim(),
      phone: parsed.e164,
      vehicle: String(vehicle || '').trim() || undefined,
      plate: String(plate || '').trim(),
      email: String(email || '').trim() || undefined
    };

    this.api.update(this.currentClientId, dto).subscribe({
      next: (updatedClient) => {
        this.items = this.items.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        );
        this.toastr.success(this.i18n.t('clients.save'));
        this.closeEditPopup();
      },
      error: () => {
        this.toastr.error(this.i18n.t('errors.loadAppointments'));
      }
    });
  }

  // ========= Utils =========
  private normalize(s: string): string {
    return (s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '');
  }
}
