/**
 * @file Login Component
 * @description Page de connexion avec redirection vers Keycloak.
 */

import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { KeycloakService } from '../../services/keycloak.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './login.component.html'
})
export class LoginComponent {
  private readonly keycloakService = inject(KeycloakService);

  currentYear = new Date().getFullYear();
  isLoading = false;

  /**
   * Redirige vers la page de connexion Keycloak
   */
  async login(): Promise<void> {
    this.isLoading = true;
    await this.keycloakService.login();
  }
}
