import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({ providedIn: 'root' })
export class I18nService {
  // keep a fallback resource for synchronous lookups if needed
  // cache translations loaded from ngx-translate (assets/i18n/*.json)
  private fallback: Record<string, Record<string, unknown>> = {};

  // Prefer inject() for TranslateService
  private translate = inject(TranslateService);

  constructor() {
    // initialize default language and prime the fallback cache
    this.translate.setDefaultLang('fr');

    // helper that attempts to load translations for a language using
    // either `getTranslation(lang)` (if available on the runtime type)
    // or `use(lang)` as a fallback. Both return an Observable of the
    // translation object in typical ngx-translate implementations.
    const load = (lang: string) => {
      const maybeGetTranslation = (this.translate as any).getTranslation;
      const loader = typeof maybeGetTranslation === 'function'
        ? (this.translate as any).getTranslation(lang)
        : this.translate.use(lang);

      // subscribe with explicit typing to avoid implicit any
      loader.subscribe((t: Record<string, unknown>) => {
        this.fallback[lang] = t || {};
      });
    };

    // load default translations into the fallback cache
    load('fr');

    // ensure the translate service is using a language
    if (!this.translate.currentLang) this.translate.use('fr');

    // keep cache up-to-date when language changes
    if (this.translate.onLangChange) {
      this.translate.onLangChange.subscribe((ev: any) => {
        load(ev.lang);
      });
    }
  }

  // get current language
  get currentLang(): string { return this.translate.currentLang || 'fr'; }

  // change language at runtime
  setLang(lang: string) {
    this.translate.use(lang);
  }

  // Async-friendly translation (returns translated string, using translate.instant fallback)
  t(key: string, params?: Record<string, string | number | null | undefined>): string {
    // ngx-translate expects params without null/undefined; convert them
    const safeParams: Record<string, string | number> | undefined = params
      ? Object.fromEntries(Object.entries(params).map(([k, v]) => [k, v == null ? '' : v]))
      : undefined;

    // Try synchronous instant() first; if not available, fallback to our cached resource
    const instant = this.translate.instant(key, safeParams);

    // If ngx-translate returned a translation (different from key) we still want to
    // ensure parameters of the form `{param}` are replaced (some resources use `{param}`
    // instead of ngx-translate's default `{{param}}`). Also support `{{param}}`.
    if (instant && instant !== key) {
      let out = String(instant);
      if (safeParams) {
        for (const k of Object.keys(safeParams)) {
          const paramVal = safeParams[k];
          const v = String(paramVal);
          // replace both {key} and {{key}} forms (with optional spaces)
          out = out.replace(new RegExp(`{{\\s*${k}\\s*}}`, 'g'), v);
          out = out.replace(new RegExp(`{${k}}`, 'g'), v);
        }
      }
      return out;
    }

    // Fallback to cached translations for sync lookup
    const parts = key.split('.');
    let cur: unknown = this.fallback[this.currentLang] || {};
    for (const p of parts) {
      // drill into the fallback object safely
      if (cur && typeof cur === 'object' && (cur as Record<string, unknown>)[p] !== undefined) {
        cur = (cur as Record<string, unknown>)[p];
      } else {
        return key;
      }
    }
    let out = String(cur);
    if (safeParams) {
      for (const k of Object.keys(safeParams)) {
        out = out.replace(new RegExp(`{${k}}`, 'g'), String(safeParams[k]));
      }
    }
    return out;
  }
}
