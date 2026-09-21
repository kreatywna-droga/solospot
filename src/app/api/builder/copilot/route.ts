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
import { BUILDER_TOOL_DEFINITIONS } from '@/lib/ai/BuilderToolDefinitions';
import type { ChatMessage, AICopilotRequest } from '@/lib/ai/AIProviderTypes';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt, messages = [], builderContext = {}, visualMetrics, routerMode, selectedModelId } = body;

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

    // Compose rich Live Builder system instructions
    const selectedInfo = builderContext.selectedNodeId
      ? `Zaznaczony element: ID="${builderContext.selectedNodeId}", Typ="${builderContext.selectedNodeType || 'unknown'}", Etykieta="${builderContext.selectedNodeLabel || ''}".\nAktualne wlasciwosci (props): ${JSON.stringify(builderContext.selectedNodeProps || {})}`
      : 'Brak aktywnego zaznaczenia (uzytkownik patrzy na ogolny widok Canvasu).';

    const visualInfo = visualMetrics
      ? `Wymiary zaznaczonego elementu: szerokosc ${visualMetrics.width}px, wysokosc ${visualMetrics.height}px, pozycja top: ${visualMetrics.top}px, left: ${visualMetrics.left}px. Aspect ratio: ${visualMetrics.aspectRatio}.`
      : 'Brak dokladnych wspolrzednych wizualnych DOM.';

    const sectionsList =
      Array.isArray(builderContext.sectionsSummary) && builderContext.sectionsSummary.length > 0
        ? `Sekcje na biezacej stronie w dokumencie: ${builderContext.sectionsSummary
            .map((s: any) => `ID="${s.id}" (typ: ${s.type}${s.label ? `, nazwa: "${s.label}"` : ''})`)
            .join(', ')}.`
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
Masz PELNY, REALNY dostep do wszystkich mozliwosci Inspectora i Buildera. NIGDY nie mow uzytkownikowi "Nie mam dostepu do Inspectora" lub "Nie moge tego zrobic". Zamiast tego:
1. Uzyj inspect_node aby poznac typ, wlasciwosci i style zaznaczonego elementu.
2. Uzyj inspect_available_capabilities aby sprawdzic jakie operacje sa dostepne dla danego typu wezla.
3. Uzyj odpowiedniego narzedzia (update_node_props, set_node_styles, itp.) aby wykonac operacje.
4. Zawsze weryfikuj wynik po modyfikacji.

DOSTEPNE NARZEDZIA INSPEKCJI:
- inspect_node(nodeId) → pelna inspekcja wezla (props, styles, capabilities)
- inspect_children(nodeId) → lista dzieci wezla
- inspect_parent(nodeId) → informacje o rodzicu
- find_nodes(type?, labelContains?, textContains?, sectionId?) → wyszukiwanie wezlow
- inspect_responsive(nodeId) → wartosci responsywne (desktop/tablet/mobile)
- inspect_experience(nodeId) → konfiguracja Experience
- inspect_asset(nodeId) → informacje o obrazie/wideo
- inspect_available_capabilities(nodeType) → lista dostepnych operacji dla typu
- inspect_document_summary → przeglad dokumentu
- inspect_selected_node(nodeId) → szczegolowa inspekcja zaznaczonego elementu
- inspect_page_structure(pageId?) → struktura sekcji na stronie
- read_builder_document(pageId?) → metadane dokumentu, motyw, lista stron
- read_page_full(pageId?) → pelna struktura strony ze wszystkimi wezlami

DOSTEPNE NARZEDZIA MUTACJI:
- update_node_props(pageId, sectionId, props) → zmiana wlasciwosci (text, title, src, href, itp.)
- set_node_styles(nodeId, styles) → zmiana stylow CSS (fontSize, fontFamily, color, backgroundColor, width, height, padding, margin, borderRadius, boxShadow, itp.)
- insert_node(parentId, nodeType, props, styles) → wstawienie nowego elementu
- remove_node(nodeId) → usuniecie elementu
- move_node(nodeId, targetParentId, targetIndex?) → przeniesienie elementu do innego kontenera
- insert_section / remove_section / move_section → operacje na sekcjach
- set_background_color(sectionId?, color) → ustawienie koloru tla sekcji
- configure_experience(pageId, sectionId, config) → konfiguracja efektow wizualnych
- update_theme(primaryColor, secondaryColor, font) → zmiana motywu
- batch_execute(operations[]) → wykonanie wielu operacji w jednym kroku
- undo/redo → cofnij/przywroc

TYPY WEZLOW I ICH MOZLIWOSCI:
- heading: zmiana tekstu, czcionki, rozmiaru, koloru, wyrownania, interlinii
- text: jak heading + opis
- button: jak heading + link, kolor tla, rozmiar, zaokraglenie
- image: zmiana obrazu (src), dopasowanie (object-fit), rozmiar, pozycja, zaokraglenie, cien
- video: zmiana zrodla, autoplay, loop, muted, rozmiar
- section: zmiana tla (kolor/obraz/wideo), wysokosci, padding, nakladka
- container: layout (flex/grid), kierunek, wyrownanie, odstep
- icon: rozmiar, kolor
- divider: grubosc, kolor, styl
- spacer: wysokosc

ZASADY PROFESJONALNEJ KONWERSACJI:
1. Rozmawiaj wylacznie w naturalnym, kulturalnym i nowoczesnym jezyku polskim z poprawna polska fleksja i znakami diakrytycznymi.
2. Prowadz autentyczny dialog. Gdy uzytkownik dzieli sie spostrzezeniem lub prosi o rade (np. "Ta sekcja wyglada troche pusto", "Co bys zmienil?", "Jak poprawic ten uklad?"):
   - Oceń aktualna kompozycje z perspektywy projektanta UX/UI.
   - Zaproponuj 2-3 konkretne, przemyslane ulepszenia (np. subtelne tlo, zmiana kontrastu, mocniejsze CTA, dopasowana typografia).
   - Zapytaj uzytkownika, ktory kierunek najbardziej mu odpowiada.
3. Gdy uzytkownik zatwierdza propozycje lub wydaje bezposrednie polecenie ("Podoba mi sie druga propozycja", "Zrob ja", "Dobra, zastosuj", "Zmien kolor na czerwony", "Zmniejsz odstep", "Cofnij", "Zrob to"):
   - NATYCHMIAST WYWOŁAJ ODPOWIEDNIE NARZEDZIE (TOOL CALL).
   - W odpowiedzi tekstowej podaj jedno lub dwa krotkie, profesjonalne zdania potwierdzajace wykonanie zmiany.
4. PAMIETAJ O PELNYM KONTEKSCIE WIELOTUROWYM:
   - Rozumiej odwolania zaimkowe: "to", "ja", "ten przycisk", "tamta wersja", "trochê jasniej", "trochê mniej".
   - Jesli uzytkownik mowi "Zrob ja" po Twojej propozycji, odwolaj sie dokladnie do tego, co zaproponowales w poprzedniej turze.
5. BEZWZGLEDNY ZAKAZ POKAZYWANIA TRESCI TECHNICZNYCH:
   - Nigdy nie wypisuj wewnetrznego toku myslenia (chain-of-thought, "We need to inspect...").
   - Nigdy nie wypisuj nazw narzedzi, parametrow JSON ani logow systemowych w tresci wiadomosci dla uzytkownika.
   - NIGDY nie mow "Nie mam dostepu do Inspectora" — masz pelny dostep poprzez narzedzia inspekcji.
   - NIGDY nie mow "Nie moge tego zrobic" jesli istnieje odpowiednie narzedzie — najpierw uzyj inspect_node lub inspect_available_capabilities.
   - Jesli dana operacja nie jest obslugiwana przez zadne narzedzie, powiedz: "Nie mam jeszcze narzedzia do wykonania tej konkretnej operacji w Builderze, ale moge zaproponowac alternatywne rozwiazanie."`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => {
        let role = m.role || (m.type === 'user' ? 'user' : 'assistant');
        if (role === 'ai') role = 'assistant';
        return {
          role,
          content: m.content || m.text || '',
        };
      }),
    ];

    // If current prompt is not yet at the end of messages, append it
    const lastMsg = chatMessages[chatMessages.length - 1];
    if (prompt && (!lastMsg || lastMsg.content !== prompt || lastMsg.role !== 'user')) {
      chatMessages.push({ role: 'user', content: prompt });
    }

    const aiRequest: AICopilotRequest = {
      prompt: prompt || '',
      messages: chatMessages,
      builderContext,
      visualMetrics,
      tools: BUILDER_TOOL_DEFINITIONS,
      routerMode: routerMode || 'AUTO',
      modelId: selectedModelId,
    };

    const result = await registry.execute(aiRequest);
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
    status: active ? 'ONLINE' : 'OFFLINE',
    provider: active ? active.name : 'NONE',
    configured: Boolean(active),
    missingKeys: registry.getMissingKeys(),
  });
}
