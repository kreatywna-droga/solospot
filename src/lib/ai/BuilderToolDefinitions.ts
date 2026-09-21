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
          description: 'Obiekt z nowymi wartościami właściwości, np. { title: "Nowy Nagłówek", buttonColor: "#FF0000", backgroundColor: "#0F172A" }.',
        },
      },
      required: ['pageId', 'sectionId', 'props'],
    },
  },
  {
    name: 'set_background_color',
    description: 'Ustaw lub zmień kolor tła sekcji (np. na kolor hex #0F172A, #080B10, #FFFFFF, granatowy, czarny, beżowy itp.).',
    parameters: {
      type: 'object',
      properties: {
        sectionId: {
          type: 'string',
          description: 'Opcjonalne ID sekcji (jeśli pominięte, modyfikuje aktualnie zaznaczoną sekcję lub pierwszą na stronie).',
        },
        color: {
          type: 'string',
          description: 'Docelowy kolor tła (kod HEX np. #0F172A, #1F3A5F, #FFFFFF, #000000 lub nazwa).',
        },
      },
      required: ['color'],
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

  // =====================================================================
  // AUTONOMOUS GENERATION TOOLS — Phase 1
  // =====================================================================

  {
    name: 'insert_node',
    description: 'Wstaw nowy węzeł (element) do kontenera/sekcji. Obsługiwane typy: text, heading, image, button, video, icon, svg, divider, spacer, container, grid. Każdy węzeł ma unikalne ID.',
    parameters: {
      type: 'object',
      properties: {
        parentId: {
          type: 'string',
          description: 'ID rodzica (sekcji lub kontenera) do którego wstawić element.',
        },
        nodeType: {
          type: 'string',
          description: 'Typ węzła: text, heading, image, button, video, icon, svg, divider, spacer, container, grid.',
          enum: ['text', 'heading', 'image', 'button', 'video', 'icon', 'svg', 'divider', 'spacer', 'container', 'grid'],
        },
        props: {
          type: 'object',
          description: 'Właściwości węzła, np. { text: "Tekst", src: "url", href: "#" }.',
        },
        styles: {
          type: 'object',
          description: 'Style CSS węzła, np. { fontSize: "16px", color: "#ffffff", padding: "12px" }.',
        },
        label: {
          type: 'string',
          description: 'Czytelna etykieta węzła.',
        },
        index: {
          type: 'number',
          description: 'Indeks wstawienia (0-based).',
        },
      },
      required: ['parentId', 'nodeType'],
    },
  },
  {
    name: 'set_node_styles',
    description: 'Ustaw style CSS na węźle (sekcji lub elemencie). Akceptuje dowolne właściwości CSS.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła do modyfikacji.',
        },
        styles: {
          type: 'object',
          description: 'Obiekt ze stylami CSS, np. { backgroundColor: "#0F172A", padding: "80px 0", borderRadius: "12px" }.',
        },
      },
      required: ['nodeId', 'styles'],
    },
  },
  {
    name: 'update_theme',
    description: 'Zaktualizuj globalny motyw strony (kolory, czcionki).',
    parameters: {
      type: 'object',
      properties: {
        primaryColor: {
          type: 'string',
          description: 'Główny kolor motywu (HEX).',
        },
        secondaryColor: {
          type: 'string',
          description: 'Drugi kolor motywu (HEX).',
        },
        font: {
          type: 'string',
          description: 'Nazwa czcionki głównej (Google Fonts).',
        },
      },
    },
  },
  {
    name: 'batch_execute',
    description: 'Wykonaj wiele operacji Builder w jednym kroku. Każda operacja to { tool, args }. Wykonuje sekwencyjnie.',
    parameters: {
      type: 'object',
      properties: {
        operations: {
          type: 'array',
          description: 'Lista operacji do wykonania. Każda operacja = { tool: "nazwa_narzędzia", args: { parametry } }.',
          items: { type: 'object' },
        },
      },
      required: ['operations'],
    },
  },
  {
    name: 'remove_node',
    description: 'Usuń węzeł (element) z dokumentu na podstawie ID.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła do usunięcia.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'read_page_full',
    description: 'Odczytaj pełną strukturę strony ze wszystkimi węzłami, właściwościami i stylami. Przydatne do weryfikacji po generowaniu.',
    parameters: {
      type: 'object',
      properties: {
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
      },
    },
  },

  // =====================================================================
  // INSPECTOR PARITY TOOLS — Full Builder Access for AI
  // =====================================================================

  {
    name: 'inspect_node',
    description: 'Pobierz pełne dane węzła: typ, właściwości, style, serta listę dostępnych capabilities. KLUCZOWE NARZĘDZIE do zrozumienia elementu przed edycją.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła do zinspectowania.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_children',
    description: 'Pobierz listę bezpośrednich dzieci węzła (typ, label, id, liczba dzieci). Użyj aby zrozumieć strukturę sekcji.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła-rodzica.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_parent',
    description: 'Pobierz informacje o rodzicu węzła (typ, label, id). Użyj aby zrozumieć kontekst hierarchiczny.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła-rodzica.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'find_nodes',
    description: 'Wyszukaj węzły po kryteriach: typ, label, treść tekstu, sekcja. Zwraca listę pasujących węzłów z ich ID.',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          description: 'Typ węzła do wyszukania (np. heading, image, button).',
        },
        labelContains: {
          type: 'string',
          description: 'Szukaj węzłów których label zawiera ten tekst.',
        },
        textContains: {
          type: 'string',
          description: 'Szukaj węzłów których treść tekstowa zawiera ten tekst.',
        },
        sectionId: {
          type: 'string',
          description: 'Ogranicz wyszukiwanie do konkretnej sekcji.',
        },
        pageId: {
          type: 'string',
          description: 'Ogranicz wyszukiwanie do konkretnej strony.',
        },
      },
    },
  },
  {
    name: 'inspect_responsive',
    description: 'Pobierz wartości responsywne węzła (desktop, tablet, mobile) oraz listę ukrytych breakpointów.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_experience',
    description: 'Pobierz konfigurację Experience (efekty wizualne, motion, tło, particles) węzła.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła (sekcji).',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_asset',
    description: 'Pobierz informacje o assetcie (obraz/wideo): URL, alt text, rozmiar, dopasowanie. Dla węzłów image i video.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła obrazu lub wideo.',
        },
      },
      required: ['nodeId'],
    },
  },
  {
    name: 'inspect_available_capabilities',
    description: 'Pobierz listę dostępnych capabilities (operacji) dla podanego typu węzła. Użyj aby wiedzieć CO możesz zrobić z danym elementem.',
    parameters: {
      type: 'object',
      properties: {
        nodeType: {
          type: 'string',
          description: 'Typ węzła (np. heading, image, button, section, container).',
          enum: ['section', 'container', 'heading', 'text', 'button', 'image', 'video', 'icon', 'divider', 'spacer', 'grid'],
        },
      },
      required: ['nodeType'],
    },
  },
  {
    name: 'inspect_document_summary',
    description: 'Pobierz zwięzły przegląd dokumentu: nazwa, strony, sekcje, motyw, łączna liczba węzłów.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
];
