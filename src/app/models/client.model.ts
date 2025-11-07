export interface Client {
  id: number;
  firstName: string;
  name: string;
  phone?: string;
  vehicle?: string;
  plate: string; // Champ obligatoire pour la plaque d'immatriculation
  email?: string; // Champ optionnel pour l'adresse e-mail
}
