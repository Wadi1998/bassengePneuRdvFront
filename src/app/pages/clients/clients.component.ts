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

  get totalPages(): number {
    return Math.ceil(this.totalClient / this.pageSize);
  }

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]],
      vehicle: ['']
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
    this.api.listPaged(this.page, this.pageSize).subscribe({
      next: (data) => {
        this.items = [...data.items];
        this.totalClient = data.total;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Impossible de charger les clients.', 'Erreur réseau');
      }
    });
  }

  // Pagination navigation
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.page = page;
    this.refreshList();
  }

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
      this.toastr.error('Veuillez corriger le formulaire.', 'Formulaire invalide');
      return;
    }

    const { firstName, name, phone, vehicle } = this.form.value as {
      firstName: string; name: string; phone: string; vehicle?: string;
    };
    const parsed = parsePhoneBE(phone);

    if (!parsed.isValid) {
      this.form.get('phone')?.setErrors({ bePhone: true });
      this.toastr.error('Numéro belge invalide.', 'Erreur');
      return;
    }

    const dto: Omit<Client, 'id'> = {
      firstName: String(firstName).trim(),
      name: String(name).trim(),
      phone: parsed.e164,
      vehicle: String(vehicle || '').trim() || undefined
    };

    this.api.create(dto).subscribe({
      next: (created) => {
        // on insère en tête pour feedback instantané
        this.items = [created, ...this.items];
        this.toastr.success('Client ajouté avec succès ✅', `${created.firstName} ${created.name}`);

        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.focusFirstInput();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Création impossible. Réessayez.', 'Erreur réseau');
      }
    });
  }

  remove(id: Client['id']): void {
    const c = this.items.find(x => x.id === id);
    const label = c ? `${c.firstName} ${c.name}` : 'ce client';
    if (!confirm(`Supprimer ${label} ?`)) return;

    this.api.remove(id).subscribe({
      next: () => {
        this.items = this.items.filter(x => x.id !== id);
        this.toastr.info('Client supprimé 🗑️');
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Suppression impossible.', 'Erreur réseau');
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
