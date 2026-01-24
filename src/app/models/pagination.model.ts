/**
 * @file Pagination Model
 * @description Modèle générique pour la pagination des données.
 * @module models/pagination
 */

/**
 * Réponse paginée générique.
 * @template T Type des éléments dans la liste
 * @interface PageResponse
 */
export interface PageResponse<T> {
  /** Liste des éléments de la page courante */
  items: T[];

  /** Nombre total d'éléments (toutes pages confondues) */
  total: number;

  /** Numéro de la page courante (commence à 1) */
  page: number;

  /** Nombre d'éléments par page */
  pageSize: number;

  /** Nombre total de pages */
  totalPages: number;
}

/**
 * Paramètres de requête pour la pagination.
 * @interface PaginationParams
 */
export interface PaginationParams {
  /** Numéro de la page (commence à 1) */
  page: number;

  /** Nombre d'éléments par page */
  pageSize: number;

  /** Terme de recherche (optionnel) */
  query?: string;
}
