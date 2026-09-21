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
    const { prompt, messages = [], builderContext = {}, visualMetrics } = body;

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

    const systemPrompt = `Jesteś SoloSpot AI Co-Builder — zaawansowanym partnerem projektowym i inżynieryjnym działającym wewnątrz SoloSpot Visual Builder.

KONTEKST BUILDERA NA ŻYWO (LIVE BUILDER CONTEXT):
- Strona: "${builderContext.pageName || 'Strona Główna'}" (ID: "${builderContext.pageId || 'page-home'}")
- Liczba sekcji w dokumencie: ${builderContext.documentNodeCount ?? 0}
- Viewport: ${builderContext.viewport || 'DESKTOP'}
- Narzędzie aktywne: ${builderContext.activeTool || 'SELECT'}
- ${selectedInfo}
- ${visualInfo}

ZASADY POSTĘPOWANIA:
1. Rozmawiaj naturalnie po polsku. Jesteś inteligentnym partnerem (nie mechanicznym automatem).
2. Jeśli użytkownik zadaje pytania lub prosi o analizę („Co widzisz?”, „Co możemy poprawić?”, „Jak wygląda hero?”), przeanalizuj aktualny kontekst Buildera i odpowiedz merytorycznie.
3. Gdy użytkownik poleca wykonanie konkretnej akcji („Zmień nagłówek na X”, „Dodaj sekcję hero”, „Zmień kolor przycisku na czerwony”, „Przesuń niżej”, „Cofnij”, „Zrób to”), WYWOŁAJ ODPOWIEDNIE NARZĘDZIE (TOOL CALL).
4. PAMIĘTAJ O HISTORII ROZMOWY:
   - Jeżeli w poprzednim kroku zaproponowałeś konkretną zmianę, a użytkownik napisał „Zrób to”, wykonaj dokładnie tę zmianę wywołując właściwe narzędzie.
   - Odnoś się do wcześniejszych wątków i referencji („to”, „ten nagłówek”, „jego kolor”).
5. NIGDY nie twórz fałszywych obietnic sukcesu w tekście bez wywołania narzędzia.
6. Nie generuj arbitralnego kodu JavaScript — posługuj się wyłącznie udostępnionymi narzędziami HACP.`;

    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => ({
        role: m.role || (m.type === 'user' ? 'user' : 'assistant'),
        content: m.content || m.text || '',
      })),
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
    };

    const result = await registry.execute(aiRequest);
    return NextResponse.json(result);
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
