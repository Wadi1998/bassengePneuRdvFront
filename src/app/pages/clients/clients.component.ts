import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl, FormArray
} from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { bePhoneLibValidator, parsePhoneBE } from '../../utils/phone-be-lib';
import { ClientsService } from '../../services/clients.service';
import { CarsService } from '../../services/cars.service';
import { Client, ClientRequest } from '../../models/client.model';
import { Car, CarRequest } from '../../models/car.model';
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
  private carsApi = inject(CarsService);
  public i18n = inject(I18nService);

  form: FormGroup;
  items: Client[] = [];

  // 🔎 recherche
  search = new FormControl<string>('', { nonNullable: true });

  // 🎯 focus "Prénom"
  @ViewChild('firstNameInput') firstNameInput?: ElementRef<HTMLInputElement>;

  // Pagination
  page = 1;
  pageSize = 20;
  totalClient = 0;

  // Ajout des propriétés pour la gestion de la popup
  isEditPopupOpen = false;
  editForm: FormGroup;
  currentClientId: number | null = null;

  // Gestion des voitures du client en édition
  clientCars: Car[] = [];
  isCarPopupOpen = false;
  carForm: FormGroup;
  editingCarId: number | null = null;

  loading = false;

  get totalPages(): number {
    return Math.ceil(this.totalClient / this.pageSize);
  }

  constructor() {
    this.form = this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]],
      // Premier véhicule (optionnel lors de la création du client)
      carBrand: [''],
      carModel: [''],
      carYear: [''],
      carPlate: ['']
    });

    // Initialisation du formulaire de modification
    this.editForm = this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]]
    });

    // Formulaire pour ajouter/modifier une voiture
    this.carForm = this.fb.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: [''],
      licensePlate: ['']
    });
  }

  // ========= Lifecycle =========
  ngOnInit(): void {
    this.search.valueChanges.subscribe(() => {
      this.page = 1;
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
    const searchQuery = this.search.value.trim();

    const request$ = searchQuery
      ? this.api.listFiltered(searchQuery, this.page, this.pageSize)
      : this.api.listPaged(this.page, this.pageSize);

    request$.subscribe({
      next: (data) => {
        this.items = [...data.items];
        this.totalClient = data.total;
        this.loading = false;

        // Charger les voitures pour chaque client si elles ne sont pas déjà incluses
        this.loadCarsForClients();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error('Impossible de charger les clients.', 'Erreur réseau');
        this.loading = false;
      }
    });
  }

  /**
   * Charge les voitures pour chaque client qui n'a pas encore ses voitures chargées
   */
  private loadCarsForClients(): void {
    this.items.forEach((client, index) => {
      // Si les voitures ne sont pas déjà chargées
      if (!client.cars || client.cars.length === 0) {
        this.carsApi.getByClientId(client.id).subscribe({
          next: (cars) => {
            // Mettre à jour le client avec ses voitures
            this.items[index] = { ...client, cars };
          },
          error: () => {
            // Silencieusement ignorer les erreurs de chargement de voitures
          }
        });
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
    // La recherche est maintenant gérée côté serveur
    return this.items;
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

  /** Affiche les voitures du client */
  getCarsDisplay(c: Client): string {
    if (!c.cars || c.cars.length === 0) return '';
    return c.cars.map(car => `${car.brand} ${car.model}`).join(', ');
  }

  trackById(_: number, c: Client) { return c.id; }
  trackByCarId(_: number, car: Car) { return car.id; }

  focusFirstInput = () => {
    queueMicrotask(() => this.firstNameInput?.nativeElement?.focus());
  };

  // ========= Actions =========
  add(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();

      // Afficher le message d'erreur approprié selon le champ invalide
      if (this.form.get('firstName')?.invalid) {
        this.toastr.error(this.i18n.t('clients.firstNameRequired'), this.i18n.t('clients.addButton'));
      } else if (this.form.get('name')?.invalid) {
        this.toastr.error(this.i18n.t('clients.nameRequired'), this.i18n.t('clients.addButton'));
      } else if (this.form.get('phone')?.invalid) {
        this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.addButton'));
      }
      return;
    }

    const { firstName, name, phone, carBrand, carModel, carYear, carPlate } = this.form.value as {
      firstName: string; name: string; phone: string;
      carBrand?: string; carModel?: string; carYear?: string; carPlate?: string;
    };
    const parsed = parsePhoneBE(phone);

    if (!parsed.isValid) {
      this.form.get('phone')?.setErrors({ bePhone: true });
      this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.addButton'));
      return;
    }

    const dto: ClientRequest = {
      firstName: String(firstName).trim(),
      name: String(name).trim(),
      phone: parsed.e164!
    };

    this.loading = true;
    this.api.create(dto).subscribe({
      next: (created) => {
        // Si une voiture a été renseignée, on l'ajoute
        const hasCar = carBrand && carModel;
        if (hasCar) {
          const carDto: CarRequest = {
            clientId: created.id,
            brand: String(carBrand).trim(),
            model: String(carModel).trim(),
            year: carYear ? parseInt(carYear, 10) : undefined,
            licensePlate: carPlate ? String(carPlate).trim() : undefined
          };
          this.carsApi.create(carDto).subscribe({
            next: (car) => {
              created.cars = [car];
              this.items = [created, ...this.items];
              this.toastr.success(this.i18n.t('clients.clientCount', { count: 1 }), `${created.firstName} ${created.name}`);
              this.loading = false;
            },
            error: () => {
              // Le client a été créé, mais pas la voiture
              this.items = [created, ...this.items];
              this.toastr.warning('Client créé mais voiture non ajoutée');
              this.loading = false;
            }
          });
        } else {
          this.items = [created, ...this.items];
          this.toastr.success(this.i18n.t('clients.clientCount', { count: 1 }), `${created.firstName} ${created.name}`);
          this.loading = false;
        }

        this.form.reset();
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.focusFirstInput();
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.i18n.t('errors.loadAppointments'), this.i18n.t('clients.addButton'));
        this.loading = false;
      }
    });
  }

  remove(id: Client['id']): void {
    const c = this.items.find(x => x.id === id);
    const label = c ? `${c.firstName} ${c.name}` : this.i18n.t('clients.removeButton');
    if (!confirm(this.i18n.t('clients.removeButton') + ' ' + label + ' ?')) return;

    this.loading = true;
    this.api.remove(id).subscribe({
      next: () => {
        this.items = this.items.filter(x => x.id !== id);
        this.toastr.info(this.i18n.t('clients.removeButton'));
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.toastr.error(this.i18n.t('errors.loadAppointments'));
        this.loading = false;
      }
    });
  }

  openEditPopup(client: Client) {
    this.isEditPopupOpen = true;
    this.currentClientId = client.id;
    this.editForm.patchValue({
      firstName: client.firstName,
      name: client.name,
      phone: client.phone
    });
    // Charger les voitures du client
    this.loadClientCars(client.id);
  }

  loadClientCars(clientId: number) {
    this.carsApi.getByClientId(clientId).subscribe({
      next: (cars) => {
        this.clientCars = cars;
      },
      error: () => {
        this.clientCars = [];
      }
    });
  }

  closeEditPopup() {
    this.isEditPopupOpen = false;
    this.currentClientId = null;
    this.clientCars = [];
  }

  updateClient() {
    if (this.editForm.invalid || this.currentClientId === null) {
      this.editForm.markAllAsTouched();

      // Afficher le message d'erreur approprié
      if (this.editForm.get('firstName')?.invalid) {
        this.toastr.error(this.i18n.t('clients.firstNameRequired'), this.i18n.t('clients.save'));
      } else if (this.editForm.get('name')?.invalid) {
        this.toastr.error(this.i18n.t('clients.nameRequired'), this.i18n.t('clients.save'));
      } else if (this.editForm.get('phone')?.invalid) {
        this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.save'));
      }
      return;
    }

    const { firstName, name, phone } = this.editForm.value as {
      firstName: string; name: string; phone: string;
    };

    const parsed = parsePhoneBE(phone);
    if (!parsed.isValid) {
      this.editForm.get('phone')?.setErrors({ bePhone: true });
      this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.save'));
      return;
    }

    const dto: ClientRequest = {
      firstName: String(firstName).trim(),
      name: String(name).trim(),
      phone: parsed.e164!
    };

    this.loading = true;
    this.api.update(this.currentClientId, dto).subscribe({
      next: (updatedClient) => {
        updatedClient.cars = this.clientCars;
        this.items = this.items.map((client) =>
          client.id === updatedClient.id ? updatedClient : client
        );
        this.toastr.success(this.i18n.t('clients.save'));
        this.closeEditPopup();
        this.loading = false;
      },
      error: () => {
        this.toastr.error(this.i18n.t('errors.loadAppointments'));
        this.loading = false;
      }
    });
  }

  // ========= Gestion des voitures =========
  openCarPopup(car?: Car) {
    this.isCarPopupOpen = true;
    if (car) {
      this.editingCarId = car.id!;
      this.carForm.patchValue({
        brand: car.brand,
        model: car.model,
        year: car.year || '',
        licensePlate: car.licensePlate || ''
      });
    } else {
      this.editingCarId = null;
      this.carForm.reset();
    }
  }

  closeCarPopup() {
    this.isCarPopupOpen = false;
    this.editingCarId = null;
    this.carForm.reset();
  }

  saveCar() {
    if (this.carForm.invalid || this.currentClientId === null) {
      this.carForm.markAllAsTouched();

      // Afficher le message d'erreur approprié
      if (this.carForm.get('brand')?.invalid) {
        this.toastr.error(this.i18n.t('clients.brandRequired') || 'La marque est obligatoire');
      } else if (this.carForm.get('model')?.invalid) {
        this.toastr.error(this.i18n.t('clients.modelRequired') || 'Le modèle est obligatoire');
      }
      return;
    }

    const { brand, model, year, licensePlate } = this.carForm.value;

    if (this.editingCarId) {
      // Modification
      const dto: CarRequest = {
        clientId: this.currentClientId,
        brand: String(brand).trim(),
        model: String(model).trim(),
        year: year ? parseInt(year, 10) : undefined,
        licensePlate: licensePlate ? String(licensePlate).trim() : undefined
      };
      this.carsApi.update(this.editingCarId, dto).subscribe({
        next: (updatedCar) => {
          this.clientCars = this.clientCars.map(c => c.id === updatedCar.id ? updatedCar : c);
          this.toastr.success('Voiture modifiée');
          this.closeCarPopup();
        },
        error: () => {
          this.toastr.error('Erreur lors de la modification');
        }
      });
    } else {
      // Création
      const dto: CarRequest = {
        clientId: this.currentClientId,
        brand: String(brand).trim(),
        model: String(model).trim(),
        year: year ? parseInt(year, 10) : undefined,
        licensePlate: licensePlate ? String(licensePlate).trim() : undefined
      };
      this.carsApi.create(dto).subscribe({
        next: (newCar) => {
          this.clientCars = [...this.clientCars, newCar];
          this.toastr.success('Voiture ajoutée');
          this.closeCarPopup();
        },
        error: () => {
          this.toastr.error('Erreur lors de l\'ajout');
        }
      });
    }
  }

  removeCar(carId: number) {
    if (!confirm('Supprimer cette voiture ?')) return;

    this.carsApi.remove(carId).subscribe({
      next: () => {
        this.clientCars = this.clientCars.filter(c => c.id !== carId);
        this.toastr.info('Voiture supprimée');
      },
      error: () => {
        this.toastr.error('Erreur lors de la suppression');
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
