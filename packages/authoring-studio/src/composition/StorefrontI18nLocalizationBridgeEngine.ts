/**
 * StorefrontI18nLocalizationBridgeEngine.ts — Sprint G1-63 Storefront Internationalization Engine (Night Shift Level 25)
 *
 * Implements a pure TypeScript, headless internationalization, multi-language content translation, and locale currency formatting engine
 * for published WEB FACTOR websites and ecommerce storefronts. Manages locale definitions, language translation dictionaries,
 * active locale switching, key translation lookups, and locale-based monetary currency formatting ($, €, zł, £).
 *
 * NO DOM, NO React, ZERO Browser APIs in domain layer.
 */

import { VectorWorkspaceState, VectorDocumentSnapshot } from '../vector/VectorWorkspaceController';

// ---------------------------------------------------------------------------
// DTOs & Interfaces
// ---------------------------------------------------------------------------

export interface LocaleDefinitionDTO {
  readonly localeCode: string; // e.g. 'en-US', 'de-DE', 'pl-PL', 'fr-FR'
  readonly languageName: string; // e.g. 'English', 'Deutsch', 'Polski', 'Français'
  readonly currencyCode: string; // e.g. 'USD', 'EUR', 'PLN', 'GBP'
  readonly currencySymbol: string; // e.g. '$', '€', 'zł', '£'
  readonly isRtl: boolean;
}

export interface TranslationDictionaryDTO {
  readonly localeCode: string;
  readonly translations: Record<string, string>;
}

export interface I18nConfigDTO {
  readonly defaultLocale: string;
  readonly activeLocale: string;
  readonly supportedLocales: ReadonlyArray<LocaleDefinitionDTO>;
  readonly dictionaries: ReadonlyArray<TranslationDictionaryDTO>;
  readonly lastUpdated: number;
}

export interface FormattedCurrencyDTO {
  readonly rawCents: number;
  readonly localeCode: string;
  readonly currencyCode: string;
  readonly formattedString: string;
}

export interface LocalizedContentExportDTO {
  readonly activeLocale: string;
  readonly translatedTextCount: number;
  readonly formattedCurrencyCount: number;
}

// ---------------------------------------------------------------------------
// Engine Implementation
// ---------------------------------------------------------------------------

export class StorefrontI18nLocalizationBridgeEngine {
  /**
   * Creates a default i18n configuration with standard supported locales (en-US, de-DE, pl-PL).
   */
  public static createDefaultI18nConfig(defaultLocale = 'en-US'): I18nConfigDTO {
    const defaultLocales: LocaleDefinitionDTO[] = [
      { localeCode: 'en-US', languageName: 'English (US)', currencyCode: 'USD', currencySymbol: '$', isRtl: false },
      { localeCode: 'de-DE', languageName: 'Deutsch', currencyCode: 'EUR', currencySymbol: '€', isRtl: false },
      { localeCode: 'pl-PL', languageName: 'Polski', currencyCode: 'PLN', currencySymbol: 'zł', isRtl: false },
      { localeCode: 'fr-FR', languageName: 'Français', currencyCode: 'EUR', currencySymbol: '€', isRtl: false }
    ];

    const defaultDictionaries: TranslationDictionaryDTO[] = [
      {
        localeCode: 'en-US',
        translations: {
          'nav.home': 'Home',
          'nav.store': 'Store',
          'cart.title': 'Your Cart',
          'checkout.button': 'Proceed to Checkout',
          'contact.submit': 'Send Message'
        }
      },
      {
        localeCode: 'de-DE',
        translations: {
          'nav.home': 'Startseite',
          'nav.store': 'Geschäft',
          'cart.title': 'Ihr Warenkorb',
          'checkout.button': 'Zur Kasse',
          'contact.submit': 'Nachricht Senden'
        }
      },
      {
        localeCode: 'pl-PL',
        translations: {
          'nav.home': 'Strona Główna',
          'nav.store': 'Sklep',
          'cart.title': 'Twój Koszyk',
          'checkout.button': 'Przejdź do Kasy',
          'contact.submit': 'Wyślij Wiadomość'
        }
      }
    ];

    return {
      defaultLocale,
      activeLocale: defaultLocale,
      supportedLocales: defaultLocales,
      dictionaries: defaultDictionaries,
      lastUpdated: Date.now()
    };
  }

  /**
   * Registers a new locale definition in the i18n configuration.
   */
  public static registerLocale(config: I18nConfigDTO, locale: LocaleDefinitionDTO): I18nConfigDTO {
    if (!config) throw new Error('StorefrontI18nLocalizationBridgeEngine: Config is null');

    const existingIndex = config.supportedLocales.findIndex(l => l.localeCode === locale.localeCode);
    const updatedLocales = existingIndex >= 0
      ? config.supportedLocales.map((l, idx) => (idx === existingIndex ? locale : l))
      : [...config.supportedLocales, locale];

    return {
      ...config,
      supportedLocales: updatedLocales,
      lastUpdated: Date.now()
    };
  }

  /**
   * Sets the active locale for storefront rendering.
   */
  public static setActiveLocale(config: I18nConfigDTO, localeCode: string): I18nConfigDTO {
    if (!config) throw new Error('StorefrontI18nLocalizationBridgeEngine: Config is null');

    const exists = config.supportedLocales.some(l => l.localeCode === localeCode);
    if (!exists) throw new Error(`StorefrontI18nLocalizationBridgeEngine: Locale '${localeCode}' is not supported`);

    return {
      ...config,
      activeLocale: localeCode,
      lastUpdated: Date.now()
    };
  }

  /**
   * Adds or updates a translation dictionary for a specific locale.
   */
  public static addTranslationDictionary(config: I18nConfigDTO, dictionary: TranslationDictionaryDTO): I18nConfigDTO {
    if (!config) throw new Error('StorefrontI18nLocalizationBridgeEngine: Config is null');

    const existingIndex = config.dictionaries.findIndex(d => d.localeCode === dictionary.localeCode);
    const updatedDictionaries = existingIndex >= 0
      ? config.dictionaries.map((d, idx) => (idx === existingIndex ? dictionary : d))
      : [...config.dictionaries, dictionary];

    return {
      ...config,
      dictionaries: updatedDictionaries,
      lastUpdated: Date.now()
    };
  }

  /**
   * Translates a content key for the currently active locale, falling back to default locale or provided fallback text.
   */
  public static translateKey(config: I18nConfigDTO, key: string, fallbackText?: string): string {
    if (!config || !key) return fallbackText || key || '';

    const activeDict = config.dictionaries.find(d => d.localeCode === config.activeLocale);
    if (activeDict && activeDict.translations[key]) {
      return activeDict.translations[key];
    }

    const defaultDict = config.dictionaries.find(d => d.localeCode === config.defaultLocale);
    if (defaultDict && defaultDict.translations[key]) {
      return defaultDict.translations[key];
    }

    return fallbackText || key;
  }

  /**
   * Formats an integer amount in cents according to a locale definition's currency symbol and formatting rules.
   */
  public static formatCurrencyForLocale(rawCents: number, locale: LocaleDefinitionDTO): FormattedCurrencyDTO {
    if (!locale) throw new Error('StorefrontI18nLocalizationBridgeEngine: Locale is null');

    const units = (rawCents / 100).toFixed(2);
    let formattedString = `${locale.currencySymbol}${units}`;

    if (locale.currencyCode === 'PLN') {
      formattedString = `${units} ${locale.currencySymbol}`;
    } else if (locale.currencyCode === 'EUR' && locale.localeCode === 'de-DE') {
      formattedString = `${units} ${locale.currencySymbol}`;
    }

    return {
      rawCents,
      localeCode: locale.localeCode,
      currencyCode: locale.currencyCode,
      formattedString
    };
  }

  /**
   * Serializes i18n configuration to JSON string.
   */
  public static serializeI18nConfig(config: I18nConfigDTO): string {
    return JSON.stringify(config);
  }

  /**
   * Restores i18n configuration from JSON string.
   */
  public static restoreI18nConfig(json: string): I18nConfigDTO {
    try {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object' || !parsed.defaultLocale) {
        throw new Error('Invalid i18n JSON structure');
      }
      return parsed as I18nConfigDTO;
    } catch (err: any) {
      throw new Error(`Failed to restore i18n config: ${err.message}`);
    }
  }
}
