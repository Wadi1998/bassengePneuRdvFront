import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { I18nService } from './services/i18n.service';
import { KeycloakService } from './services/keycloak.service';
import { environment } from '../environments/environment';

@Component({
  standalone: true,
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  open = false;          // pour le menu mobile
  today = new Date();
  version = environment.app.version;

  // Services
  public i18n = inject(I18nService);
  public keycloak = inject(KeycloakService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    // Forcer la mise à jour après initialisation Keycloak
    console.log('AppComponent init, isAuthenticated:', this.keycloak.isAuthenticated());
  }

  /**
   * Vérifie si l'utilisateur est connecté
   */
  isLoggedIn(): boolean {
    const authenticated = this.keycloak.isAuthenticated();
    console.log('isLoggedIn called:', authenticated);
    return authenticated;
  }

  /**
   * Récupère le profil utilisateur
   */
  get userProfile() {
    return this.keycloak.userProfile();
  }

  /**
   * Vérifie si l'utilisateur est admin
   */
  get isAdmin(): boolean {
    return this.keycloak.isAdmin();
  }

  /**
   * Déconnexion via Keycloak
   */
  async logout(): Promise<void> {
    await this.keycloak.logout();
  }
}
