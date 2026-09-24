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
    name: 'move_node',
    description: 'Przenieś węzeł do innego kontenera lub zmień jego kolejność. Przenosi element z jednego rodzica do drugiego lub zmienia indeks w obrębie tego samego rodzica.',
    parameters: {
      type: 'object',
      properties: {
        nodeId: {
          type: 'string',
          description: 'ID węzła do przeniesienia.',
        },
        targetParentId: {
          type: 'string',
          description: 'ID docelowego rodzica. null oznacza przeniesienie do głównego poziomu strony.',
        },
        targetIndex: {
          type: 'number',
          description: 'Docelowy indeks (0-based) w obrębie rodzica.',
        },
      },
      required: ['nodeId', 'targetParentId'],
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
  // LIBRARY INTELLIGENCE TOOLS — Experience, Section, Template Discovery
  // =====================================================================

  {
    name: 'search_experiences',
    description: 'Przeszukaj bibliotekę Experience (270+ efektów wizualnych). Zwraca listę pasujących Experience z ich typami, kategoriami, nastrojami i poziomami motion.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Zapytanie tekstowe (np. "premium hero", "particles technology", "luxury product").',
        },
        type: {
          type: 'string',
          description: 'Typ Experience: hero, section, interactive, background, effect, motion, website.',
          enum: ['hero', 'section', 'interactive', 'background', 'effect', 'motion', 'website', 'all'],
        },
        category: {
          type: 'string',
          description: 'Kategoria (np. "bento", "glass", "particles", "gradient").',
        },
        mood: {
          type: 'string',
          description: 'Nastrój: dark, light, minimal, editorial, cinematic, bold, elegant, futuristic, playful, corporate, luxury, creative, vibrant, modern.',
        },
        industry: {
          type: 'string',
          description: 'Branża docelowa (np. "technology", "luxury", "creative", "education").',
        },
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników (domyślnie 20).',
        },
      },
    },
  },
  {
    name: 'inspect_experience',
    description: 'Pobierz szczegółowe informacje o konkretnym Experience: opis, nastrój, motion, przypadki użycia, sloty na assety.',
    parameters: {
      type: 'object',
      properties: {
        experienceId: {
          type: 'string',
          description: 'ID Experience do zinspectowania.',
        },
      },
      required: ['experienceId'],
    },
  },
  {
    name: 'get_experience_categories',
    description: 'Pobierz listę dostępnych kategorii Experience z liczbą elementów w każdej kategorii.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'search_sections',
    description: 'Przeszukaj bibliotekę sekcji (20+ kategorii: hero, features, testimonials, pricing, FAQ, contact, itp.).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Zapytanie tekstowe (np. "hero dark", "testimonial grid").',
        },
        category: {
          type: 'string',
          description: 'Kategoria sekcji (hero, features, about, testimonials, cta, pricing, faq, contact, footer, gallery, team, stats, logos, newsletter, services, portfolio, products, blog, content).',
        },
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników.',
        },
      },
    },
  },
  {
    name: 'search_website_templates',
    description: 'Przeszukaj bibliotekę gotowych szablonów stron (website templates).',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Zapytanie tekstowe (np. "agency", "portfolio", "restaurant").',
        },
        industry: {
          type: 'string',
          description: 'Branża docelowa.',
        },
        limit: {
          type: 'number',
          description: 'Maksymalna liczba wyników.',
        },
      },
    },
  },
  {
    name: 'get_typography_presets',
    description: 'Pobierz listę dostępnych presetów typografii z rekomendacjami użycia.',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_design_presets',
    description: 'Pobierz listę dostępnych presetów designu (kolorów, czcionek, motywów).',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'resolve_target',
    description: 'Rozwiąż naturalne odniesienie do elementu (np. "ten nagłówek", "ta sekcja", "pierwsza sekcja"). Zwraca ID i typ znalezionego elementu.',
    parameters: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Tekst z odniesieniem do rozwiązania.',
        },
      },
      required: ['prompt'],
    },
  },

  // =====================================================================
  // LIBRARY INSERTION TOOLS — Real insertion from Section/Experience Library
  // =====================================================================

  {
    name: 'insert_section_from_library',
    description: 'Wstaw konkretną sekcję z biblioteki (odkrytą przez search_sections) do dokumentu. Użyj ID sekcji zwróconego przez search_sections. Tworzy REALNĄ sekcję z pełną zawartością (node tree) z biblioteki.',
    parameters: {
      type: 'object',
      properties: {
        sectionTemplateId: {
          type: 'string',
          description: 'ID szablonu sekcji z biblioteki (zwrócone przez search_sections, np. "hero-centered", "features-3-cards", "testimonials-grid").',
        },
        pageId: {
          type: 'string',
          description: 'ID strony docelowej. Jeśli pominięte, wstawia na stronę główną.',
        },
        atIndex: {
          type: 'number',
          description: 'Indeks (0-based) na liście sekcji, gdzie wstawić. Jeśli pominięte, wstawia na koniec.',
        },
        label: {
          type: 'string',
          description: 'Opcjonalna czytelna etykieta sekcji.',
        },
      },
      required: ['sectionTemplateId'],
    },
  },
  {
    name: 'insert_experience_from_library',
    description: 'Wstaw konkretne Experience z biblioteki (odkryte przez search_experiences) do sekcji. Użyj ID Experience zwróconego przez search_experiences. Konfiguruje efekty wizualne na docelowej sekcji.',
    parameters: {
      type: 'object',
      properties: {
        experienceId: {
          type: 'string',
          description: 'ID Experience z biblioteki (zwrócone przez search_experiences).',
        },
        sectionId: {
          type: 'string',
          description: 'ID sekcji docelowej do której dodać Experience. Jeśli pominięte, użyj aktualnie zaznaczonej sekcji.',
        },
        pageId: {
          type: 'string',
          description: 'ID strony.',
        },
        configuration: {
          type: 'object',
          description: 'Opcjonalna dodatkowa konfiguracja Experience (intensity, custom settings).',
        },
      },
      required: ['experienceId'],
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
  // ── Design System (ONE catalog — packages/design-system) ─────────
  {
    name: 'search_design_styles',
    description: 'Przeszukaj katalog Design System (style packs, fonts, palettes, typography, components). Zwraca prawdziwe pozycje z jednego katalogu używanego też przez UI Buildera.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Fraza wyszukiwania (np. dental, luxury, premium).' },
        category: { type: 'string', description: 'Kategoria: style-packs|fonts|colors|typography|buttons|cards|backgrounds|industry-presets|radius|shadows|sections|hero.' },
        industry: { type: 'string', description: 'Filtr branży (np. dental, saas).' },
        mood: { type: 'string', description: 'Filtr nastroju (np. luxury, modern).' },
        style: { type: 'string', description: 'Filtr stylu.' },
        limit: { type: 'number', description: 'Maks. liczba wyników na kategorię.' },
      },
    },
  },
  {
    name: 'search_style_packs',
    description: 'Przeszukaj Style Packs w Design System (te same ID co w UI Buildera).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Fraza (np. dental, luxury).' },
        industry: { type: 'string', description: 'Filtr branży.' },
        mood: { type: 'string', description: 'Filtr nastroju.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_fonts',
    description: 'Przeszukaj font library Design System.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub tag fontu.' },
        category: { type: 'string', description: 'Kategoria fontu.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_font_pairings',
    description: 'Przeszukaj pary fontów (display + body).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa pary lub fontu.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_color_palettes',
    description: 'Przeszukaj palety kolorów Design System.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub styl palety.' },
        industry: { type: 'string', description: 'Filtr branży.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_typography_systems',
    description: 'Przeszukaj systemy typografii.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub styl.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_button_styles',
    description: 'Przeszukaj style przycisków.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub styl.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_card_styles',
    description: 'Przeszukaj style kart.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub styl.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_backgrounds',
    description: 'Przeszukaj style tła (backgrounds).',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Nazwa lub styl.' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'search_industry_presets',
    description: 'Przeszukaj presety branżowe (Industry Presets) z rekomendowanymi Style Packami.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Fraza lub branża.' },
        industry: { type: 'string', description: 'Dokładna branża (np. dental).' },
        limit: { type: 'number', description: 'Maks. wyników.' },
      },
    },
  },
  {
    name: 'inspect_design_style',
    description: 'Pokaż szczegóły stylu designu (font, paleta, radius, shadow) wraz z kompatybilnością.',
    parameters: {
      type: 'object',
      properties: {
        styleId: { type: 'string', description: 'ID stylu z katalogu.' },
      },
      required: ['styleId'],
    },
  },
  {
    name: 'inspect_style_pack',
    description: 'Pokaż pełny Style Pack: typography, colors, radius, shadows, buttons, cards, compatibility.',
    parameters: {
      type: 'object',
      properties: {
        packId: { type: 'string', description: 'ID Style Packa (np. sp-luxury-dental).' },
      },
      required: ['packId'],
    },
  },
  {
    name: 'apply_design_style',
    description: 'Zastosuj Style Pack do motywu strony (realna mutacja BuilderDocument przez UPDATE_THEME). Zmienia kolory, font, radius — NIE niszczy struktury ani treści.',
    parameters: {
      type: 'object',
      properties: {
        stylePackId: { type: 'string', description: 'ID Style Packa do zastosowania.' },
        options: {
          type: 'object',
          description: 'Opcjonalne ograniczenie: { applyTo: ["colors","typography","radius","background"] }.',
        },
      },
      required: ['stylePackId'],
    },
  },
];
