/**
 * /api/builder/copilot/route.ts — SoloSpot AI Co-Builder API Route
 *
 * Receives multi-turn conversation, Live Builder Context, and Visual Metrics.
 * Interacts with configured real LLM provider (OpenAI / Gemini).
 * Returns real model text and/or structured HACP tool calls.
 *
 * If no provider credentials are configured, honestly returns
 * AI_PROVIDER = NOT_CONFIGURED without faking execution.
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIProviderRegistry } from '@/lib/ai/AIProviderRegistry';
import { selectRequestTools, assertToolsWithinSurface } from '@/lib/ai/selectRequestTools';
import type { ChatMessage, AICopilotRequest } from '@/lib/ai/AIProviderTypes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, messages = [], builderContext = {}, visualMetrics, routerMode, selectedModelId, attachments = [] } = body;

    const registry = AIProviderRegistry.getInstance();

    // If no provider configured, return early with honest NOT_CONFIGURED status
    if (!registry.isAnyConfigured()) {
      const missing = registry.getMissingKeys();
      return NextResponse.json({
        status: 'NOT_CONFIGURED',
        provider: 'NONE',
        model: 'NONE',
        message:
          'AI Provider nie jest skonfigurowany w srodowisku SoloSpot. Brak zmiennych: ' +
          missing.join(', ') +
          '.',
        missingKeys: missing,
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      });
    }

    // Compose rich Live Builder system instructions — REAL BUILDER STATE
    const selectedInfo = builderContext.selectedNodeId
      ? `ZAZNACZONY ELEMENT (REALNY STAN BUILDERA):
- ID: "${builderContext.selectedNodeId}"
- Typ: "${builderContext.selectedNodeType || 'unknown'}"
- Etykieta: "${builderContext.selectedNodeLabel || ''}"
- Sekcja nadrzędna: "${builderContext.selectedNodeLabel || 'unknown'}"
- Właściwości (props): ${JSON.stringify(builderContext.selectedNodeProps || {})}
- Viewport: ${builderContext.viewport || 'DESKTOP'}
Użyj inspect_node("${builderContext.selectedNodeId}") aby poznać pełne style, capabilities i strukturę tego elementu.`
      : 'BRAK AKTYWNEGO ZAZNACZENIA — użytkownik patrzy na ogólny widok Canvasu. Użyj inspect_page_structure aby zobaczyć strukturę strony.';

    const visualInfo = visualMetrics
      ? `Wymiary DOM zaznaczonego elementu: szerokość ${visualMetrics.width}px, wysokość ${visualMetrics.height}px, pozycja top: ${visualMetrics.top}px, left: ${visualMetrics.left}px. Aspect ratio: ${visualMetrics.aspectRatio}.`
      : '';

    const sectionsList =
      Array.isArray(builderContext.sectionsSummary) && builderContext.sectionsSummary.length > 0
        ? `SEKCJE NA STRONIE (${builderContext.sectionsSummary.length} sekcji):
${builderContext.sectionsSummary
  .map((s: any, i: number) => `  ${i + 1}. ${s.label || s.type} (ID: "${s.id}", typ: ${s.type})`)
  .join('\n')}`
        : '';

    const systemPrompt = `Jestes SoloSpot AI — profesjonalnym, inteligentnym partnerem projektowym i inzynierskim dzialajacym wewnatrz SoloSpot Visual Builder. Prowadzisz naturalny, profesjonalny dialog (na wzor ChatGPT).

KONTEKST BUILDERA NA ZYWO (LIVE BUILDER CONTEXT):
- Strona: "${builderContext.pageName || 'Strona Glowna'}" (ID: "${builderContext.pageId || 'page-home'}")
- Liczba sekcji w dokumencie: ${builderContext.documentNodeCount ?? 0}
- Viewport: ${builderContext.viewport || 'DESKTOP'}
- Narzedzie aktywne: ${builderContext.activeTool || 'SELECT'}
- ${selectedInfo}
- ${sectionsList}
- ${visualInfo}

PELNY DOSTEP DO BUILDERA:
Masz PELNY, REALNY dostep do narzedzi inspekcji i mutacji wymienionych ponizej. NIGDY nie mow uzytkownikowi "Nie mam dostepu do Inspectora" lub "Nie moge tego zrobic". Zamiast tego:
1. Uzyj inspect_node aby poznac typ, wlasciwosci i style zaznaczonego elementu.
2. Uzyj find_nodes aby znalezc wezly po tekscie lub etykiecie.
3. Uzyj odpowiedniego narzedzia (update_node_props, set_node_styles, itp.) aby wykonac operacje.
4. Zawsze weryfikuj wynik po modyfikacji.
5. Jesli uzytkownik zabrania jakiegos tekstu (np. "nie moze byc napisane X") lub prosi o zmiane istniejacego naglowka/tytulu: NAJPIERW find_nodes(textContains="X") lub find_nodes(labelContains=...), potem update_node_props DOKLADNIE na kazdym znalezionym wezle — nie tworz nowych sekcji i nie edytuj only parenta gdy tekst jest w dziecku.

DOSTEPNE NARZEDZIA INSPEKCJI:
- inspect_node(nodeId) → pelna inspekcja wezla (props, styles, capabilities)
- inspect_children(nodeId) → lista dzieci wezla
- find_nodes(type?, labelContains?, textContains?, sectionId?) → wyszukiwanie wezlow
- inspect_document_summary → przeglad dokumentu
- inspect_selected_node(nodeId) → szczegolowa inspekcja zaznaczonego elementu
- inspect_page_structure(pageId?) → struktura sekcji na stronie
- read_builder_document(pageId?) → metadane dokumentu, motyw, lista stron
- read_page_full(pageId?) → pelna struktura strony ze wszystkimi wezlami

DOSTEPNE NARZEDZIA MUTACJI:
- update_node_props(pageId, sectionId, props) → zmiana wlasciwosci (text, title, src, href, itp.)
- set_node_styles(nodeId, styles) → zmiana stylow CSS (patrz ponizej pelna lista wlasciwosci)
- remove_node(nodeId) → usuniecie elementu
- remove_section / move_section → operacje na sekcjach
- insert_section_from_library(sectionTemplateId, pageId?, atIndex?, label?) → WSTAWIENIE REALNEJ SEKCJI Z BIBLIOTEKI (uzyj ID z search_sections)
- insert_experience_from_library(experienceId, sectionId?, pageId?, configuration?) → WSTAWIENIE EXPERIENCE Z BIBLIOTEKI (uzyj ID z search_experiences)
- configure_experience(pageId, sectionId, config) → konfiguracja efektow wizualnych
- update_theme(primaryColor, secondaryColor, font, backgroundColor?, borderRadius?) → zmiana motywu
- apply_design_style(stylePackId) → ZASTOSUJ Style Pack z Design System (realna mutacja UPDATE_THEME; NIE niszczy struktury)
- undo/redo → cofnij/przywroc

DOSTEPNE NARZEDZIA BIBLIOTEKI:
- search_experiences(query?, type?, category?, mood?, industry?, limit?) → przeszukaj biblioteke 270+ Experience
- search_sections(query?, category?, limit?) → przeszukaj biblioteke sekcji (hero, features, testimonials, etc.)
- search_website_templates(query?, industry?, limit?) → przeszukaj gotowe szablony stron
- get_typography_presets() → presety czcionek z rekomendacjami
- get_design_presets() → presety designu (kolory, czcionki, motywy)
- resolve_target(prompt) → rozwiąż naturalne odniesienie do elementu

DESIGN SYSTEM (jeden katalog — te same ID co w UI Buildera):
- search_design_styles(query?, category?, industry?, mood?, style?, limit?) → przeszukaj style packs, fonts, palettes, typography, components
- search_style_packs(query?, industry?, mood?, limit?) → Style Packs (te ID co w panelu Styl → Katalog)
- search_fonts / search_font_pairings / search_color_palettes / search_typography_systems
- search_button_styles / search_card_styles / search_backgrounds / search_industry_presets
- inspect_design_style(styleId) / inspect_style_pack(packId) → szczegoly + compatibility score
- apply_design_style(stylePackId) → mutacja motywu przez UPDATE_THEME (kolory, font, radius, background)
Uzywaj apply_design_style gdy uzytkownik prosi o zmianę stylu/looku (np. "Zmien na luxury dental", "premium dental style") — NIE wymyślaj hexów gdy istnieje Style Pack.

UWAGA O ASSETACH:
AI NIE posiada narzedzi do przeszukiwania ani wstawiania My Assets / SoloSpot Library / zewnetrznych providerow (Shutterstock, Pexels). Jesli uzytkownik prosi o obraz lub wideo z biblioteki assetow, odpowiedz uczciwie: "Nie mam jeszcze narzedzia do wstawiania assetow z biblioteki — mozesz wybrac obrecz recznie w panelu Assets." Nie obiecuj TAKE takiej operacji.

PELNIA MOZLIWOSCI BUILDERA — SEMANTYCZNA WIEDZA:

TYPOGRAFIA (set_node_styles):
- fontFamily: nazwa czcionki (np. "Inter", "Playfair Display", "Space Grotesk")
- fontSize: rozmiar (np. "48px", "3rem", "clamp(2rem, 5vw, 4rem)")
- fontWeight: grubosc (100-900, "thin" do "black")
- lineHeight: wyokosc linii (np. "1.2" dla naglowkow, "1.6" dla tekstu)
- letterSpacing: odstep miedzy literami (np. "-0.02em" dla naglowkow, "0.05em" dla caps)
- textAlign: wyrownanie ("left", "center", "right", "justify")
- textTransform: transformacja ("uppercase", "lowercase", "capitalize", "none")
- color: kolor tekstu (hex, rgb)
- whiteSpace: zawijanie tekstu ("normal", "nowrap")

HIERARCHIA TYPOGRAFICZNA:
- H1: 48-72px, bold (700-900), lineHeight 1.05-1.15, letterSpacing -0.02em — GLOWNY NAGLOWEK
- H2: 36-48px, semibold (600-700), lineHeight 1.15-1.25 — PODTYTUL SEKCJI
- H3: 24-36px, medium-semibold (500-700), lineHeight 1.2-1.3 — NAGLOWEK BLOKU
- Body: 16-18px, regular (400), lineHeight 1.5-1.7 — TEKT SCIEZKOWY
- Small: 12-14px, regular (400), lineHeight 1.5 — PODPISY, META
- CTA: 14-18px, medium-semibold (500-700), uppercase, letterSpacing 0.05em — PRZYCISKI
Zawsze uzywaj hierarchii. Nigdy nie uzywaj jednego rozmiaru dla wszystkiego.

UKLAD (set_node_styles):
- width/height: wymiary (np. "100%", "400px", "clamp(300px, 50vw, 600px)")
- minWidth/maxWidth/minHeight/maxHeight: ograniczenia
- padding: wewnetrzne odstępy (np. "80px 0", "24px 32px", "0 16px")
- margin: zewnetrzne odstępy
- gap: odstep miedzy dziecmi (np. "24px", "32px")
- display: "flex", "grid", "block"
- flexDirection: "row", "column" — kierunek flexbox
- alignItems: "flex-start", "center", "stretch" — wyrównanie poprzeczne
- justifyContent: "flex-start", "center", "space-between" — wyrównanie podluzne
- gridTemplateColumns: "repeat(3, 1fr)", "1fr 2fr" — kolumny grid
Prawidlowy padding sekcji: 60-120px (desktop), 40-60px (mobile). Gap miedzy sekcjami: 0 (inline) lub 80-120px (separate).

KOLORY (set_node_styles + update_theme):
- backgroundColor: kolor tla (hex)
- color: kolor tekstu
- borderColor: kolor obramowania
- backgroundImage: gradient (np. "linear-gradient(135deg, #1a1a2e, #16213e)")
- overlayColor: nakladka kolorowa
- overlayOpacity: przezroczystosc nakladki (0-1)
PALETA: Uzywaj 5-7 kolorow max. Glowny + drugi + akcent + tlo + powierzchnia + tekst + przytlumiony. Nigdy nie uzywaj losowych kolorow dla kazdej sekcji.

OBRAMOWANIE I CIEN:
- borderRadius: zaokraglenie (np. "8px", "12px", "9999px" dla pill)
- borderWidth/borderStyle/borderColor: obramowanie
- boxShadow: cien (np. "0 4px 6px rgba(0,0,0,0.1)", "0 20px 40px rgba(0,0,0,0.3)")
- opacity: przezroczystosc (0-1)
- backdropFilter: rozmycie tla (np. "blur(10px)")

RESPONSIVE:
Kazdy element moze miec osobne style dla desktop/tablet/mobile.
Uzywaj inspect_node aby odczytac aktualne style, a set_node_styles aby ustawic warstwe desktop/tablet/mobile.
Zmiana czcionek: desktop 48px -> tablet 36px -> mobile 28px.
Zmiana paddingu: desktop 80px -> tablet 60px -> mobile 40px.
Zmiana layoutu: desktop row -> mobile column.
Zmiana kolumn: desktop 3 -> tablet 2 -> mobile 1.

EXPERIENCE (configure_experience):
- background: aurora, mesh-gradient, ambient-blobs, glowing-orb, video, shader, interactive-gradient
- motion: float, pulse, breathe, drift, wave, morph, orbit
- pointer: tilt, spotlight, parallax, magnetic, glow, perspective
- scroll: sticky-story, horizontal-showcase, parallax-depth, timeline-scrub, reveal
- effects: glass, liquid-morph, bloom, chromatic-aberration, glow-border
- particles: count, size, speed, pointerInfluence
Kiedy uzyc: premium/luksusowy -> mesh-gradient + subtle motion. Kreatywny -> particles + shader. Korporacyjny -> reveal + minimal. Portfolio -> parallax-depth + sticky-story.

BIBLIOTEKI I EXPERIENCE:
- search_experiences(query?, type?, category?, mood?, industry?) → przeszukaj 270+ Experience
- search_sections(query?, category?) → przeszukaj bibliotekę sekcji (hero, features, testimonials, etc.)
- search_website_templates(query?, industry?) → przeszukaj gotowe szablony stron
- get_typography_presets → presety czcionek z rekomendacjami
- get_design_presets → presety designu (kolory, czcionki, motywy)
- resolve_target(prompt) → rozwiąż naturalne odniesienie ("ten nagłówek", "ta sekcja", "pierwsza sekcja")
- search_design_styles / search_style_packs / search_fonts / search_color_palettes → Design System (ten sam katalog co panel Styl)
- inspect_style_pack(packId) → szczegoly Style Packa + compatibility
- apply_design_style(stylePackId) → zastosuj Style Pack do motywu (mutacja)

WSTAWIANIE Z BIBLIOTEKI (BEZWZGLĘDNIE WYMAGANE):
Gdy uzytkownik prosi o dodanie sekcji z biblioteki:
1. Wywołaj search_sections aby znaleźć odpowiednią sekcję.
2. Z wyników wyszukania weź ID szablonu (pole "id", np. "hero-centered", "features-3-cards").
3. NATYCHMIAST wywołaj insert_section_from_library(sectionTemplateId: "<ID z wyniku>").
4. NIGDY nie kończ na samym search_sections — ZAWSZE wykonaj insert_section_from_library.

Gdy uzytkownik prosi o dodanie Experience:
1. Wywołaj search_experiences aby znaleźć odpowiednie Experience.
2. Z wyników wyszukaj ID Experience (pole "id").
3. NATYCHMIAST wywołaj insert_experience_from_library(experienceId: "<ID z wyniku>", sectionId: "<ID sekcji docelowej>").
4. NIGDY nie kończ na samym search_experiences — ZAWSZE wykonaj insert_experience_from_library.

WORKFLOW Z BIBLIOTEKAMI:
1. Gdy uzytkownik prosi o Experience → search_experiences → insert_experience_from_library.
2. Gdy uzytkownik prosi o sekcję → search_sections → insert_section_from_library.
3. Gdy uzytkownik prosi o szablon → search_website_templates.
4. NIGDY nie wstawiaj Experience "z głowy" — ZAWSZE najpierw przeszukaj bibliotekę.
5. ABSOLUTNY ZAKAZ: Nie mów "Znalazłem sekcję. Teraz ją dodam." BEZ wykonania tool call insert_section_from_library. Jeśli znalazłeś — WSTAW natychmiast.

SEMANTYCZNE ODNIOSIENIA:
- "ten nagłówek" → użyj resolve_target lub sprawdź selectedNodeId
- "ta sekcja" → użyj resolve_target lub sprawdź selectedSectionId
- "ją" / "go" → odwołaj się do ostatnio modyfikowanego/zaznaczonego elementu
- "pierwsza sekcja" → pierwsza sekcja w kolejności
- "ostatni przycisk" → ostatni button w drzewie

ZASADY PROFESJONALNEJ KONWERSACJI:
1. Rozmawiaj wylacznie w naturalnym, kulturalnym i nowoczesnym jezyku polskim z poprawna polska fleksja i znakami diakrytycznymi.
2. Prowadz autentyczny dialog. Gdy uzytkownik dzieli sie spostrzezeniem lub prosi o rade:
   - Oceń aktualna kompozycje z perspektywy projektanta UX/UI.
   - Zaproponuj 2-3 konkretne, przemyslane ulepszenia.
   - Zapytaj uzytkownika, ktory kierunek najbardziej mu odpowiada.
3. Gdy uzytkownik zatwierdza propozycje lub wydaje bezposrednie polecenie:
   - NATYCHMIAST WYWOŁAJ ODPOWIEDNIE NARZEDZIE (TOOL CALL).
   - W odpowiedzi tekstowej podaj jedno lub dwa krotkie, profesjonalne zdania potwierdzajace wykonanie zmiany.
4. PAMIETAJ O PELNYM KONTEKSCIE WIELOTUROWYM:
   - Rozumiej odwolania zaimkowe: "to", "ja", "ten przycisk", "tamta wersja".
   - Jesli uzytkownik mowi "Zrob ja" po Twojej propozycji, odwolaj sie dokladnie do tego, co zaproponowales w poprzedniej turze.
5. BEZWZGLEDNY ZAKAZ POKAZYWANIA TRESCI TECHNICZNYCH:
   - Nigdy nie wypisuj wewnetrznego toku myslenia.
   - Nigdy nie wypisuj nazw narzedzi, parametrow JSON ani logow systemowych.
   - NIGDY nie mow "Nie mam dostepu do Inspectora" — masz pelny dostep poprzez narzedzia inspekcji.
   - NIGDY nie mow "Nie moge tego zrobic" jesli istnieje odpowiednie narzedzie.
   - Jesli dana operacja nie jest obslugiwana przez zadne narzedzie, powiedz: "Nie mam jeszcze narzedzia do wykonania tej konkretnej operacji w Builderze, ale moge zaproponowac alternatywne rozwiazanie."

6. ABSOLUTNA PRAWDOMOWNOŚĆ — ZERO FAKE BEHAVIOR:
   - NIGDY nie mow "widzę Canvas" jesli nie otrzymales screenshotu.
   - NIGDY nie mow "sprawdziłem Experience Library" jesli nie wykonaliles search_experiences.
   - NIGDY nie mow "zmieniłem kolor" jesli nie wykonales mutacji (update_node_props lub set_node_styles).
   - NIGDY nie mow "strona wygląda dobrze" jesli nie masz danych do oceny.
   - Kazda operacja musi byc REALNIE wykonana przez narzedzie (tool call) i zweryfikowana.
   - Jesli nie mozesz czegos zrobic, powiedz: "Nie mam jeszcze możliwości wykonania tej operacji."
   - Kazdy execution response musi miec status: SUCCESS, FAILED, BLOCKED, lub NOT_AVAILABLE.
   - NIGDY nie uzywaj FAKE SUCCESS.

7. INTELIGENCJA BIBLIOTECZNA:
   - Zawsze najpierw przeszukaj bibliotekę zanim wstawisz Experience lub sekcję.
   - Uzyj search_experiences aby znaleźć odpowiednie Experience.
   - Uzyj search_sections aby znaleźć odpowiednią sekcję z biblioteki.
   - Dobieraj Experience na podstawie: branży, nastroju, motion level, celu.
   - NIGDY nie wstawiaj losowego Experience — zawsze uzasadnij wybór.`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => {
        let role = m.role || (m.type === 'user' ? 'user' : 'assistant');
        if (role === 'ai') role = 'assistant';
        return {
          role,
          content: m.content || m.text || '',
          attachments: m.attachments,
        };
      }),
    ];

    // If current prompt is not yet at the end of messages, append it
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (prompt && (!lastMsg || lastMsg.content !== prompt || lastMsg.role !== 'user')) {
      chatMessages.push({ role: 'user', content: prompt, attachments });
    } else if (lastMsg && lastMsg.role === 'user' && attachments && attachments.length > 0) {
      lastMsg.attachments = attachments;
    }

    const aiRequest: AICopilotRequest = {
      prompt: prompt || '',
      messages: chatMessages,
      builderContext,
      visualMetrics,
      tools: undefined, // Tools are selected dynamically via ToolSurfaceSelector
      routerMode: routerMode || 'FREE',
      modelId: selectedModelId,
    };

    // DUAL-PATH UNIFICATION GATE — classify once; every subsequent path
    // must send request.tools ⊆ selectedToolSurface. Full BUILDER_TOOL_DEFINITIONS
    // (including batch_execute) is REPO-only and must never reach the model.
    const surface = selectRequestTools(aiRequest.prompt, {
      hasSelection: Boolean(builderContext.selectedNodeId),
      selectedNodeType: builderContext.selectedNodeType,
      documentNodeCount: builderContext.documentNodeCount ?? 0,
    });
    // Defense-in-depth: even if surface.tools were wrong, keep only names on surface.
    const allowedNames = new Set(surface.toolNames);
    const surfaceTools = surface.tools.filter((t) => allowedNames.has(t.name));
    const surfaceCheck = assertToolsWithinSurface(surfaceTools, surface.intentList);
    if (!surfaceCheck.ok) {
      console.error('[copilot] Tool surface leak blocked:', surfaceCheck.leaked);
    }

    // FREE/AUTO ORCHESTRATION: Model SELECTS within surface, SoloSpot EXECUTES, HACP SECURES
    if (aiRequest.routerMode === 'FREE' || aiRequest.routerMode === 'AUTO') {
      try {
        const { AgentOrchestrator } = await import('@/lib/ai/AgentOrchestrator');
        const activeProvider = registry.getActiveProvider();
        if (activeProvider) {
          const orchestrator = new AgentOrchestrator({
            generateWithTools: (req) => activeProvider.generateWithTools(req),
          });
          const orchResult = await orchestrator.orchestrate(aiRequest, {
            documentNodeCount: builderContext.documentNodeCount ?? 0,
            hasSelection: Boolean(builderContext.selectedNodeId),
            selectedNodeType: builderContext.selectedNodeType,
            sectionsSummary: builderContext.sectionsSummary,
          });

          // Convert orchestrator result to AICopilotResponse format
          // TRUTHFULNESS: Never map CHAT/PARTIAL/SUCCESS incorrectly —
          // ERROR stays ERROR, NOT_CONFIGURED stays NOT_CONFIGURED,
          // FAILED (thrown provider) maps to ERROR, CLARIFICATION_REQUIRED maps to PARTIAL.
          const statusMap: Record<string, string> = {
            SUCCESS: 'SUCCESS',
            CHAT: 'CHAT',
            PARTIAL: 'PARTIAL',
            ERROR: 'ERROR',
            NOT_CONFIGURED: 'NOT_CONFIGURED',
            FAILED: 'ERROR',
            CLARIFICATION_REQUIRED: 'PARTIAL',
          };
          const result = {
            status: statusMap[orchResult.status] || orchResult.status,
            provider: 'AgentOrchestrator',
            model: orchResult.modelUsed,
            message: orchResult.message,
            error: orchResult.error,
            toolCalls: orchResult.toolCalls.length > 0 ? orchResult.toolCalls : undefined,
            isFreeModel: true,
            routerMode: `ORCHESTRATED_${aiRequest.routerMode}`,
            durationMs: orchResult.durationMs,
          };

          return NextResponse.json(result, {
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          });
        }
      } catch (orchErr: any) {
        // CONTROLLED CONTINUATION: keep the SAME Tool Surface — never expand
        // to the full builder tool set (that bypass was the dual-path root cause).
        console.warn(
          '[copilot] Orchestrator failed, continuing on same tool surface:',
          orchErr?.message,
          'intent=',
          surface.intent,
          'tools=',
          surface.toolNames
        );
      }
    }

    // CONTROLLED CONTINUATION / PAID / MANUAL path:
    // direct provider execution restricted to the selected Tool Surface only.
    const controlledRequest: AICopilotRequest = {
      ...aiRequest,
      tools: surfaceTools.length > 0 ? surfaceTools : undefined,
    };
    const result = await registry.execute(controlledRequest);
    return NextResponse.json(result, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    });
  } catch (err: any) {
    console.error('[/api/builder/copilot] Error:', err);
    return NextResponse.json(
      {
        status: 'ERROR',
        provider: 'UNKNOWN',
        model: 'UNKNOWN',
        message: `Blad serwera podczas obslugi zapytania AI: ${err?.message || 'Nieznany blad'}`,
        error: String(err?.message || err),
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  const registry = AIProviderRegistry.getInstance();
  const active = registry.getActiveProvider();
  return NextResponse.json({
    status: active ? 'ONLINE' : 'NOT_CONFIGURED',
    provider: active ? active.name : 'NONE',
    configured: Boolean(active),
    missingKeys: registry.getMissingKeys(),
  });
}
