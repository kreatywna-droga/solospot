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
          'AI Provider nie jest skonfigurowany w środowisku SoloSpot. Brak zmiennych: ' +
          missing.join(', ') +
          '.',
        missingKeys: missing,
        error: 'AI_PROVIDER = NOT_CONFIGURED',
      });
    }

    // Compose rich Live Builder system instructions
    const selectedInfo = builderContext.selectedNodeId
      ? `Zaznaczony element: ID="${builderContext.selectedNodeId}", Typ="${builderContext.selectedNodeType || 'unknown'}", Etykieta="${builderContext.selectedNodeLabel || ''}".\nAktualne właściwości (props): ${JSON.stringify(builderContext.selectedNodeProps || {})}`
      : 'Brak aktywnego zaznaczenia (użytkownik patrzy na ogólny widok Canvasu).';

    const visualInfo = visualMetrics
      ? `Wymiary zaznaczonego elementu: szerokość ${visualMetrics.width}px, wysokość ${visualMetrics.height}px, pozycja top: ${visualMetrics.top}px, left: ${visualMetrics.left}px. Aspect ratio: ${visualMetrics.aspectRatio}.`
      : 'Brak dokładnych współrzędnych wizualnych DOM.';

    const sectionsList =
      Array.isArray(builderContext.sectionsSummary) && builderContext.sectionsSummary.length > 0
        ? `Sekcje na bieżącej stronie w dokumencie: ${builderContext.sectionsSummary
            .map((s: any) => `ID="${s.id}" (typ: ${s.type}${s.label ? `, nazwa: "${s.label}"` : ''})`)
            .join(', ')}.`
        : '';

    const systemPrompt = `Jesteś SoloSpot AI — profesjonalnym, inteligentnym partnerem projektowym i inżynieryjnym działającym wewnątrz SoloSpot Visual Builder. Prowadzisz naturalny, profesjonalny dialog (na wzór ChatGPT).

KONTEKST BUILDERA NA ŻYWO (LIVE BUILDER CONTEXT):
- Strona: "${builderContext.pageName || 'Strona Główna'}" (ID: "${builderContext.pageId || 'page-home'}")
- Liczba sekcji w dokumencie: ${builderContext.documentNodeCount ?? 0}
- Viewport: ${builderContext.viewport || 'DESKTOP'}
- Narzędzie aktywne: ${builderContext.activeTool || 'SELECT'}
- ${selectedInfo}
- ${sectionsList}
- ${visualInfo}

ZASADY PROFESJONALNEJ KONWERSACJI:
1. Rozmawiaj wyłącznie w naturalnym, kulturalnym i nowoczesnym języku polskim z poprawną polską fleksją i znakami diakrytycznymi (ą, ć, ę, ł, ń, ó, ś, ź, ż).
2. Prowadź autentyczny dialog. Gdy użytkownik dzieli się spostrzeżeniem lub prosi o radę (np. „Ta sekcja wygląda trochę pusto”, „Co byś zmienił?”, „Jak poprawić ten układ?”):
   - Oceń aktualną kompozycję z perspektywy projektanta UX/UI.
   - Zaproponuj 2–3 konkretne, przemyślane ulepszenia (np. subtelne tło, zmiana kontrastu, mocniejsze CTA, dopasowana typografia).
   - Zapytaj użytkownika, który kierunek najbardziej mu odpowiada.
3. Gdy użytkownik zatwierdza propozycję lub wydaje bezpośrednie polecenie („Podoba mi się druga propozycja”, „Zrób ją”, „Dobra, zastosuj”, „Zmień kolor na czerwony”, „Zmniejsz odstęp”, „Cofnij”, „Zrób to”):
   - NATYCHMIAST WYWOŁAJ ODPOWIEDNIE NARZĘDZIE (TOOL CALL).
   - W odpowiedzi tekstowej podaj jedno lub dwa krótkie, profesjonalne zdania potwierdzające wykonanie zmiany.
4. PAMIĘTAJ O PEŁNYM KONTEKŚCIE WIELOTUROWYM:
   - Rozumiej odwołania zaimkowe: „to”, „ją”, „ten przycisk”, „tamta wersja”, „trochę jaśniej”, „trochę mniej”.
   - Jeśli użytkownik mówi „Zrób ją” po Twojej propozycji, odwołaj się dokładnie do tego, co zaproponowałeś w poprzedniej turze.
5. BEZWZGLĘDNY ZAKAZ POKAZYWANIA TREŚCI TECHNICZNYCH:
   - Nigdy nie wypisuj wewnętrznego toku myślenia (chain-of-thought, „We need to inspect...”).
   - Nigdy nie wypisuj nazw narzędzi, parametrów JSON ani logów systemowych w treści wiadomości dla użytkownika.
   - Jeśli dana operacja nie jest obsługiwana przez żadne dostępne narzędzie, powiedz wprost i życzliwie: „Nie mam jeszcze narzędzia do wykonania tej operacji w Builderze, ale mogę zaproponować alternatywne rozwiązanie.”`;

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
        message: `Błąd serwera podczas obsługi zapytania AI: ${err?.message || 'Nieznany błąd'}`,
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
