/**
 * BuilderToolDefinitions.ts — SoloSpot Visual Builder HACP Tool Schemas
 *
 * Formal capabilities exposed to LLM function calling.
 * Strict schemas prevent arbitrary code execution while enabling full builder control.
 */

import type { HacpToolDefinition } from './AIProviderTypes';

export const BUILDER_TOOL_DEFINITIONS: HacpToolDefinition[] = [
  {
    name: 'test_echo',
    description: 'Narzędzie diagnostyczne. Zwraca echo przekazanej wiadomości tekstowej.',
    parameters: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description: 'Wiadomość testowa.',
        },
      },
      required: ['message'],
    },
  },
  {
    name: 'read_builder_document',
    description: 'Odczytaj aktualne metadane dokumentu, listę stron oraz globalny motyw sklepu.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'Opcjonalne ID strony do odczytu szczegółów. Jeśli pominięte, odczytuje stronę główną.',
        },
      },
    },
  },
  {
    name: 'inspect_selected_node',
    description: 'Pobierz szczegółowe właściwości (props), style i geometrię aktualnie zaznaczonej lub wskazanej sekcji.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID sekcji lub węzła do inspekcji.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_page_structure',
    description: 'Pobierz pełną listę sekcji w kolejności renderowania na wybranej stronie wraz z ich typami i etykietami.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony (np. page-home).',
        },
      },
    },
  },
  {
    name: 'insert_section',
    description: 'Wstaw nową sekcję do dokumentu sklepu (np. hero, cta, product-grid, testimonials, newsletter, feature-grid).',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony, na której wstawić sekcję.',
        },
        sectionType: {
          type: 'string',
          description: 'Typ sekcji: hero, product-grid, feature-grid, testimonials, newsletter, footer, navbar, content, container.',
          enum: ['hero', 'product-grid', 'feature-grid', 'testimonials', 'newsletter', 'footer', 'navbar', 'content', 'container'],
        },
        atIndex: {
          type: 'number',
          description: 'Indeks (0-based) na liście sekcji, gdzie wstawić nowy element. 0 oznacza sam początek strony.',
        },
        label: {
          type: 'string',
          description: 'Czytelna dla człowieka nazwa sekcji.',
        },
        defaultProps: {
          type: 'object',
          description: 'Wstępne właściwości sekcji, np. title, subtitle, cta, buttonColor.',
        },
      },
      required: ['pageId', 'sectionType'],
    },
  },
  {
    name: 'remove_section',
    description: 'Usuń sekcję z drzewa strony na podstawie jej ID.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
        sectionId: {
          type: 'string',
          description: 'ID sekcji do usunięcia.',
        },
      },
      required: ['pageId', 'sectionId'],
    },
  },
  {
    name: 'move_section',
    description: 'Zmień kolejność sekcji na stronie przenosząc ją z indeksu fromIndex na toIndex.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
        fromIndex: {
          type: 'number',
          description: 'Obecny indeks sekcji.',
        },
        toIndex: {
          type: 'number',
          description: 'Nowy docelowy indeks sekcji.',
        },
      },
      required: ['pageId', 'fromIndex', 'toIndex'],
    },
  },
  {
    name: 'update_node_props',
    description: 'Zaktualizuj właściwości sekcji (np. title, subtitle, cta, ctaText, buttonColor, backgroundColor, image).',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
        sectionId: {
          type: 'string',
          description: 'ID sekcji do modyfikacji.',
        },
        props: {
          type: 'object',
          description: 'Obiekt z nowymi wartościami właściwości, np. { title: "Nowy Nagłówek", buttonColor: "#FF0000" }.',
        },
      },
      required: ['pageId', 'sectionId', 'props'],
    },
  },
  {
    name: 'configure_experience',
    description: 'Skonfiguruj zaawansowane efekty wizualne Experience (gradienty mesh, interaktywny spotlight, kursor 3D, motion).',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
        sectionId: {
          type: 'string',
          description: 'ID sekcji.',
        },
        experienceConfig: {
          type: 'object',
          description: 'Konfiguracja efektów wizualnych ExperienceRuntimeScene.',
        },
      },
      required: ['pageId', 'sectionId', 'experienceConfig'],
    },
  },
  {
    name: 'undo',
    description: 'Cofnij ostatnią wykonaną modyfikację w historii dokumentu.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'redo',
    description: 'Przywróć ostatnio cofniętą modyfikację w historii dokumentu.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
