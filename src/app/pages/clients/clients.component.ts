import { Component, ElementRef, ViewChild, OnInit, AfterViewInit, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Subject, finalize, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { bePhoneLibValidator, parsePhoneBE } from '../../utils/phone-be-lib';
import { ClientsService } from '../../services/clients.service';
import { CarsService } from '../../services/cars.service';
import { Client, ClientRequest } from '../../models/client.model';
import { Car, CarRequest } from '../../models/car.model';
import { I18nService } from '../../services/i18n.service';

// ─────────────────────────────────────────────────────────────────────────────
// Types internes
// ─────────────────────────────────────────────────────────────────────────────
interface ClientFormValue {
  firstName: string;
  name: string;
  phone: string;
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  carPlate?: string;
}

interface CarFormValue {
  brand: string;
  model: string;
  year?: string;
  licensePlate?: string;
}

interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composant
// ─────────────────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-clients',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './clients.component.html'
})
export class ClientsComponent implements OnInit, AfterViewInit, OnDestroy {
  // ═══════════════════════════════════════════════════════════════════════════
  // Injections
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly fb = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly clientsApi = inject(ClientsService);
  private readonly carsApi = inject(CarsService);
  public readonly i18n = inject(I18nService);

  // ═══════════════════════════════════════════════════════════════════════════
  // État du composant
  // ═══════════════════════════════════════════════════════════════════════════
  private readonly destroy$ = new Subject<void>();

  // Formulaires
  readonly form: FormGroup;
  readonly editForm: FormGroup;
  readonly carForm: FormGroup;
  readonly search = new FormControl<string>('', { nonNullable: true });

  // Données
  items: Client[] = [];
  clientCars: Car[] = [];

  // Pagination
  page = 1;
  readonly pageSize = 20;
  totalClient = 0;

  // États UI
  loading = false;
  isEditPopupOpen = false;
  isCarPopupOpen = false;
  currentClientId: number | null = null;
  editingCarId: number | null = null;

  // Modal de confirmation
  confirmDialog: ConfirmDialogData | null = null;

  // Focus
  @ViewChild('firstNameInput') private firstNameInput?: ElementRef<HTMLInputElement>;

  // ═══════════════════════════════════════════════════════════════════════════
  // Getters
  // ═══════════════════════════════════════════════════════════════════════════
  get totalPages(): number {
    return Math.ceil(this.totalClient / this.pageSize);
  }

  get filtered(): Client[] {
    return this.items;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Constructeur
  // ═══════════════════════════════════════════════════════════════════════════
  constructor() {
    this.form = this.createClientForm();
    this.editForm = this.createEditForm();
    this.carForm = this.createCarForm();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Lifecycle
  // ═══════════════════════════════════════════════════════════════════════════
  ngOnInit(): void {
    this.initSearchListener();
    this.refreshList();
  }

  ngAfterViewInit(): void {
    this.focusFirstInput();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Création des formulaires
  // ═══════════════════════════════════════════════════════════════════════════
  private createClientForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]],
      carBrand: [''],
      carModel: [''],
      carYear: [''],
      carPlate: ['']
    });
  }

  private createEditForm(): FormGroup {
    return this.fb.group({
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      phone: ['', [Validators.required, bePhoneLibValidator()]]
    });
  }

  private createCarForm(): FormGroup {
    return this.fb.group({
      brand: ['', Validators.required],
      model: ['', Validators.required],
      year: [''],
      licensePlate: ['']
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Initialisation
  // ═══════════════════════════════════════════════════════════════════════════
  private initSearchListener(): void {
    this.search.valueChanges
      .pipe(
        debounceTime(300), // Attend 300ms après la dernière frappe
        distinctUntilChanged(), // Ne déclenche que si la valeur change vraiment
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.page = 1;
        this.refreshList();
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Chargement des données
  // ═══════════════════════════════════════════════════════════════════════════
  private refreshList(): void {
    this.loading = true;
    const searchQuery = this.search.value.trim();

    const request$ = searchQuery
      ? this.clientsApi.listFiltered(searchQuery, this.page, this.pageSize)
      : this.clientsApi.listPaged(this.page, this.pageSize);

    request$
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (data) => {
          this.items = [...data.items];
          this.totalClient = data.total;
          this.loadCarsForClients();
        },
        error: (err) => this.handleError(err, 'errors.loadClients')
      });
  }

  private loadCarsForClients(): void {
    this.items.forEach((client, index) => {
      if (!client.cars || client.cars.length === 0) {
        this.carsApi
          .getByClientId(client.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (cars) => {
              this.items[index] = { ...client, cars };
            },
            error: () => {
              // Silencieux - les voitures ne sont pas critiques
            }
          });
      }
    });
  }

  private loadClientCars(clientId: number): void {
    this.carsApi
      .getByClientId(clientId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cars) => (this.clientCars = cars),
        error: () => (this.clientCars = [])
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Pagination
  // ═══════════════════════════════════════════════════════════════════════════
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

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions CRUD Client
  // ═══════════════════════════════════════════════════════════════════════════
  add(): void {
    if (!this.validateForm(this.form, 'clients.addButton')) return;

    const formValue = this.form.value as ClientFormValue;
    const parsed = parsePhoneBE(formValue.phone);

    if (!parsed.isValid) {
      this.setPhoneError(this.form);
      return;
    }

    const dto = this.buildClientDto(formValue, parsed.e164!);
    this.loading = true;

    this.clientsApi
      .create(dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (created) => this.handleClientCreated(created, formValue),
        error: (err) => this.handleError(err, 'errors.createClient')
      });
  }

  remove(id: Client['id']): void {
    const client = this.items.find((x) => x.id === id);
    const label = client ? `${client.firstName} ${client.name}` : '';

    this.openConfirmDialog({
      title: this.i18n.t('clients.removeButton'),
      message: `${this.i18n.t('clients.confirmDelete') || 'Êtes-vous sûr de vouloir supprimer'} ${label} ?`,
      confirmText: this.i18n.t('clients.removeButton'),
      cancelText: this.i18n.t('clients.cancel'),
      onConfirm: () => this.executeRemoveClient(id)
    });
  }

  private executeRemoveClient(id: Client['id']): void {
    this.loading = true;

    this.clientsApi
      .remove(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: () => {
          this.items = this.items.filter((x) => x.id !== id);
          this.toastr.info(this.i18n.t('clients.clientDeleted') || 'Client supprimé');
        },
        error: (err) => this.handleError(err, 'errors.deleteClient')
      });
  }

  updateClient(): void {
    if (!this.validateForm(this.editForm, 'clients.save') || this.currentClientId === null) return;

    const formValue = this.editForm.value as { firstName: string; name: string; phone: string };
    const parsed = parsePhoneBE(formValue.phone);

    if (!parsed.isValid) {
      this.setPhoneError(this.editForm);
      return;
    }

    const dto: ClientRequest = {
      firstName: formValue.firstName.trim(),
      name: formValue.name.trim(),
      phone: parsed.e164!
    };

    this.loading = true;

    this.clientsApi
      .update(this.currentClientId, dto)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (updatedClient) => {
          updatedClient.cars = this.clientCars;
          this.items = this.items.map((c) => (c.id === updatedClient.id ? updatedClient : c));
          this.toastr.success(this.i18n.t('clients.clientUpdated') || 'Client mis à jour');
          this.closeEditPopup();
        },
        error: (err) => this.handleError(err, 'errors.updateClient')
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Actions CRUD Voiture
  // ═══════════════════════════════════════════════════════════════════════════
  saveCar(): void {
    if (!this.validateCarForm() || this.currentClientId === null) return;

    const formValue = this.carForm.value as CarFormValue;
    const dto = this.buildCarDto(formValue, this.currentClientId);

    if (this.editingCarId) {
      this.updateCar(dto);
    } else {
      this.createCar(dto);
    }
  }

  private createCar(dto: CarRequest): void {
    this.carsApi
      .create(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCar) => {
          this.clientCars = [...this.clientCars, newCar];
          this.toastr.success(this.i18n.t('clients.carAdded') || 'Voiture ajoutée');
          this.closeCarPopup();
        },
        error: () => this.toastr.error(this.i18n.t('errors.addCar') || "Erreur lors de l'ajout")
      });
  }

  private updateCar(dto: CarRequest): void {
    this.carsApi
      .update(this.editingCarId!, dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCar) => {
          this.clientCars = this.clientCars.map((c) => (c.id === updatedCar.id ? updatedCar : c));
          this.toastr.success(this.i18n.t('clients.carUpdated') || 'Voiture modifiée');
          this.closeCarPopup();
        },
        error: () => this.toastr.error(this.i18n.t('errors.updateCar') || 'Erreur lors de la modification')
      });
  }

  removeCar(carId: number): void {
    this.openConfirmDialog({
      title: this.i18n.t('clients.deleteCar') || 'Supprimer la voiture',
      message: this.i18n.t('clients.confirmDeleteCar') || 'Voulez-vous vraiment supprimer cette voiture ?',
      confirmText: this.i18n.t('clients.removeButton'),
      cancelText: this.i18n.t('clients.cancel'),
      onConfirm: () => this.executeRemoveCar(carId)
    });
  }

  private executeRemoveCar(carId: number): void {
    this.carsApi
      .remove(carId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.clientCars = this.clientCars.filter((c) => c.id !== carId);
          this.toastr.info(this.i18n.t('clients.carDeleted') || 'Voiture supprimée');
        },
        error: () => this.toastr.error(this.i18n.t('errors.deleteCar') || 'Erreur lors de la suppression')
      });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Popups
  // ═══════════════════════════════════════════════════════════════════════════
  openEditPopup(client: Client): void {
    this.isEditPopupOpen = true;
    this.currentClientId = client.id;
    this.editForm.patchValue({
      firstName: client.firstName,
      name: client.name,
      phone: client.phone
    });
    this.loadClientCars(client.id);
  }

  closeEditPopup(): void {
    this.isEditPopupOpen = false;
    this.currentClientId = null;
    this.clientCars = [];
    this.editForm.reset();
  }

  openCarPopup(car?: Car): void {
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

  closeCarPopup(): void {
    this.isCarPopupOpen = false;
    this.editingCarId = null;
    this.carForm.reset();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Modal de confirmation
  // ═══════════════════════════════════════════════════════════════════════════
  private openConfirmDialog(data: ConfirmDialogData): void {
    this.confirmDialog = data;
  }

  closeConfirmDialog(): void {
    this.confirmDialog = null;
  }

  confirmAction(): void {
    if (this.confirmDialog) {
      this.confirmDialog.onConfirm();
      this.closeConfirmDialog();
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Helpers d'affichage
  // ═══════════════════════════════════════════════════════════════════════════
  phoneDisplay(e164: string | undefined): string {
    if (!e164) return '';
    const p = parsePhoneBE(e164);
    return p.isValid ? (p.national || e164) : e164;
  }

  initials(client: Client): string {
    const first = client.firstName || '';
    const last = client.name || '';
    return (first.charAt(0) + last.charAt(0)).toUpperCase();
  }

  getCarsDisplay(client: Client): string {
    if (!client.cars || client.cars.length === 0) return '';
    return client.cars.map((car) => `${car.brand} ${car.model}`).join(', ');
  }

  trackById(_: number, client: Client): number {
    return client.id;
  }

  trackByCarId(_: number, car: Car): number | undefined {
    return car.id;
  }

  focusFirstInput(): void {
    queueMicrotask(() => this.firstNameInput?.nativeElement?.focus());
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Méthodes privées de validation
  // ═══════════════════════════════════════════════════════════════════════════
  private validateForm(form: FormGroup, actionKey: string): boolean {
    if (form.valid) return true;

    form.markAllAsTouched();

    const controls = form.controls;
    if (controls['firstName']?.invalid) {
      this.toastr.error(this.i18n.t('clients.firstNameRequired'), this.i18n.t(actionKey));
    } else if (controls['name']?.invalid) {
      this.toastr.error(this.i18n.t('clients.nameRequired'), this.i18n.t(actionKey));
    } else if (controls['phone']?.invalid) {
      this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t(actionKey));
    }

    return false;
  }

  private validateCarForm(): boolean {
    if (this.carForm.valid) return true;

    this.carForm.markAllAsTouched();

    if (this.carForm.get('brand')?.invalid) {
      this.toastr.error(this.i18n.t('clients.brandRequired') || 'La marque est obligatoire');
    } else if (this.carForm.get('model')?.invalid) {
      this.toastr.error(this.i18n.t('clients.modelRequired') || 'Le modèle est obligatoire');
    }

    return false;
  }

  private setPhoneError(form: FormGroup): void {
    form.get('phone')?.setErrors({ bePhone: true });
    this.toastr.error(this.i18n.t('clients.phoneInvalid'), this.i18n.t('clients.addButton'));
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Méthodes privées de construction
  // ═══════════════════════════════════════════════════════════════════════════
  private buildClientDto(formValue: ClientFormValue, phone: string): ClientRequest {
    return {
      firstName: formValue.firstName.trim(),
      name: formValue.name.trim(),
      phone
    };
  }

  private buildCarDto(formValue: CarFormValue, clientId: number): CarRequest {
    return {
      clientId,
      brand: formValue.brand.trim(),
      model: formValue.model.trim(),
      year: formValue.year ? parseInt(formValue.year, 10) : undefined,
      licensePlate: formValue.licensePlate?.trim() || undefined
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gestion après création client
  // ═══════════════════════════════════════════════════════════════════════════
  private handleClientCreated(created: Client, formValue: ClientFormValue): void {
    const hasCar = formValue.carBrand && formValue.carModel;

    if (hasCar) {
      this.createCarForNewClient(created, formValue);
    } else {
      this.finalizeClientCreation(created);
    }
  }

  private createCarForNewClient(client: Client, formValue: ClientFormValue): void {
    const carDto: CarRequest = {
      clientId: client.id,
      brand: formValue.carBrand!.trim(),
      model: formValue.carModel!.trim(),
      year: formValue.carYear ? parseInt(formValue.carYear, 10) : undefined,
      licensePlate: formValue.carPlate?.trim() || undefined
    };

    this.carsApi
      .create(carDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (car) => {
          client.cars = [car];
          this.finalizeClientCreation(client);
        },
        error: () => {
          this.items = [client, ...this.items];
          this.toastr.warning(this.i18n.t('clients.clientCreatedButNocar') || 'Client créé mais voiture non ajoutée');
          this.resetForm();
        }
      });
  }

  private finalizeClientCreation(client: Client): void {
    this.items = [client, ...this.items];
    this.toastr.success(
      this.i18n.t('clients.clientCreated') || 'Client créé',
      `${client.firstName} ${client.name}`
    );
    this.resetForm();
  }

  private resetForm(): void {
    this.form.reset();
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.focusFirstInput();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // Gestion des erreurs
  // ═══════════════════════════════════════════════════════════════════════════
  private handleError(error: unknown, i18nKey: string): void {
    console.error(error);
    this.toastr.error(this.i18n.t(i18nKey) || 'Une erreur est survenue');
  }
}
