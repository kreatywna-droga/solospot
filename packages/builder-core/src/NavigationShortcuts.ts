/**
 * Navigation Shortcuts — C16.2 Smart Navigation Integration
 *
 * Defines navigable section categories that automatically link to the
 * website header/navbar as editable shortcuts.
 */

export type NavigableSectionCategory =
  | 'pricing'
  | 'about'
  | 'features'
  | 'services'
  | 'gallery'
  | 'testimonials'
  | 'faq'
  | 'contact';

export interface NavigableShortcutDefinition {
  readonly label: string;
  readonly anchor: string;
}

export const NAVIGABLE_CATEGORY_MAP: Record<string, NavigableShortcutDefinition | undefined> = {
  pricing:      { label: 'Cennik', anchor: '#cennik' },
  about:        { label: 'O nas', anchor: '#o-nas' },
  features:     { label: 'Cechy', anchor: '#cechy' },
  services:     { label: 'Usługi', anchor: '#uslugi' },
  gallery:      { label: 'Galeria', anchor: '#galeria' },
  testimonials: { label: 'Opinie', anchor: '#opinie' },
  faq:          { label: 'FAQ', anchor: '#faq' },
  contact:      { label: 'Kontakt', anchor: '#kontakt' },
};
