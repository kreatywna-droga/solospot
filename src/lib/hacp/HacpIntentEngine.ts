/**
 * HacpIntentEngine.ts — Conversational AI Copilot Intent Engine v1.0
 *
 * Implements deterministic multi-mode intent classification:
 * - CHAT:                 Casual dialogue, questions, guidance (NO mutation, NO HACP card)
 * - INSPECT:              Query current builder/visual state (READ context, NO mutation)
 * - PROPOSE:              Advisory recommendations & design ideas (NO mutation, stores lastProposal)
 * - CLARIFY:              Ambiguous / underspecified requests (NO mutation, prompts for details)
 * - EXECUTE:              Explicit mutation command or confirmation of proposal (HACP mutation)
 * - UNDO:                 Natural revert command ("Cofnij", "Wycofaj to", "Nie podoba mi się, cofnij")
 * - PLATFORM_ENGINEERING: SoloSpot Builder platform tasks (Smart Guides, tools, inspect, capabilities)
 * - AUDIT:                Systematic audit of page structure, tokens, or runtime
 * - DEBUG:                Root cause analysis of issues or anomalies
 */

import type {
  HacpIntentType,
  HacpEngineeringScope,
  HacpConversationContext,
  HacpBuilderContext,
  HacpProposal,
  AppliedChangeItem,
} from './HacpTypes';
import type { BuilderDocument, BuilderNode } from '../../../packages/builder-core/src';

export interface IntentClassificationResult {
  intent: HacpIntentType;
  scope: HacpEngineeringScope;
  confidence: number;
  reason: string;
  targetNodeId?: string;
  confirmedProposal?: HacpProposal;
  extractedParameters?: Record<string, unknown>;
  visualCritique?: string;
}

export class HacpIntentEngine {
  /**
   * Classify user prompt against conversation and builder contexts.
   */
  public static classify(
    rawPrompt: string,
    conversation: HacpConversationContext,
    builderContext: HacpBuilderContext,
    document: BuilderDocument
  ): IntentClassificationResult {
    const prompt = rawPrompt.trim();
    const lower = prompt.toLowerCase();

    // ------------------------------------------------------------------------
    // Rule 0: UNDO Intent (Natural revert commands)
    // "Cofnij", "Cofnij to", "Wycofaj", "Nie podoba mi się. Cofnij", "Undo"
    // ------------------------------------------------------------------------
    const isUndo =
      lower === 'cofnij' ||
      lower === 'cofnij to' ||
      lower === 'cofnij.' ||
      lower === 'wycofaj' ||
      lower === 'wycofaj to' ||
      lower === 'wycofaj tę zmianę' ||
      lower === 'wycofaj te zmiane' ||
      lower.includes('nie podoba mi się. cofnij') ||
      lower.includes('nie podoba mi sie. cofnij') ||
      lower.includes('nie podoba mi się, cofnij') ||
      lower.includes('nie podoba mi sie, cofnij') ||
      lower.includes('jednak cofnij') ||
      lower === 'przywróć poprzedni stan' ||
      lower === 'przywroc poprzedni stan' ||
      lower === 'undo';

    if (isUndo) {
      return {
        intent: 'UNDO',
        scope: 'PAGE_DESIGN',
        confidence: 0.99,
        reason: 'User explicitly requested to undo previous mutation',
        targetNodeId: conversation.lastModifiedNodeId || builderContext.selectedNodeId,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 1: PLATFORM_ENGINEERING Intent
    // Distinguish developing client page from developing SoloSpot Builder itself:
    // "prowadnice", "smart guides", "wix", "inspector", "zmień prowadnice", "narzędzia buildera"
    // ------------------------------------------------------------------------
    const isPlatformTask =
      lower.includes('prowadnice') ||
      lower.includes('smart guides') ||
      lower.includes('smartguides') ||
      lower.includes('podobne do wix') ||
      lower.includes('jak w wix') ||
      lower.includes('w builderze') ||
      lower.includes('funkcjonalność buildera') ||
      lower.includes('funkcjonalnosc buildera') ||
      lower.includes('rozwój buildera') ||
      lower.includes('rozwoj buildera') ||
      lower.includes('kod buildera') ||
      lower.includes('nowe capability') ||
      lower.includes('nowe capabilities') ||
      lower.includes('zmień inspector') ||
      lower.includes('zmien inspector') ||
      lower.includes('architektura buildera') ||
      lower.includes('canvas engine');

    if (isPlatformTask) {
      return {
        intent: 'PLATFORM_ENGINEERING',
        scope: 'PLATFORM_ENGINEERING',
        confidence: 0.96,
        reason: 'User requested SoloSpot Builder platform development / engineering task',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 2: AUDIT & DEBUG Intents
    // "Zrób audyt", "Audyt strony", "Dlaczego to nie działa?", "Zdiagnozuj"
    // ------------------------------------------------------------------------
    const isAudit =
      lower === 'zrób audyt' ||
      lower === 'zrob audyt' ||
      lower === 'zrób audyt.' ||
      lower === 'audyt' ||
      lower.includes('przeprowadź audyt') ||
      lower.includes('przeprowadz audyt') ||
      lower.includes('audyt strony') ||
      lower.includes('sprawdź czy działa') ||
      lower.includes('sprawdz czy dziala');

    if (isAudit) {
      return {
        intent: 'AUDIT',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'User requested a systematic audit of active page structure and tokens',
        targetNodeId: builderContext.selectedNodeId,
      };
    }

    const isDebug =
      lower.includes('dlaczego to nie działa') ||
      lower.includes('dlaczego to nie dziala') ||
      lower.includes('czemu to nie działa') ||
      lower.includes('debuguj') ||
      lower.includes('zdiagnozuj problem') ||
      lower.includes('jaki jest błąd');

    if (isDebug) {
      return {
        intent: 'DEBUG',
        scope: 'PAGE_DESIGN',
        confidence: 0.94,
        reason: 'User requested root cause debugging / diagnostics',
        targetNodeId: builderContext.selectedNodeId,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 3: Contextual Confirmation of previous PROPOSE
    // "Tak", "Zrób to", "Zrób wszystko", "Zrób", "Zastosuj", "Wykonaj", "Zgoda"
    // ------------------------------------------------------------------------
    const isAffirmative =
      lower === 'tak' ||
      lower === 'tak.' ||
      lower === 'tak, zrób to' ||
      lower === 'tak zrób to' ||
      lower === 'zrób to' ||
      lower === 'zrób to.' ||
      lower === 'zrób' ||
      lower === 'zrob' ||
      lower === 'zrób.' ||
      lower === 'zrób wszystko' ||
      lower === 'zrob wszystko' ||
      lower === 'zastosuj' ||
      lower === 'zastosuj tę propozycję' ||
      lower === 'zastosuj to' ||
      lower === 'wykonaj' ||
      lower === 'wykonaj to' ||
      lower === 'jasne' ||
      lower === 'zgoda' ||
      lower === 'dobra' ||
      lower === 'ok' ||
      lower === 'okej';

    if (isAffirmative && conversation.lastProposal) {
      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.98,
        reason: 'User explicitly confirmed the previous proposal',
        targetNodeId: conversation.lastProposal.targetNodeId,
        confirmedProposal: conversation.lastProposal,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 4: Explicit CHAT Intents (Greetings, general questions)
    // ------------------------------------------------------------------------
    const isPureGreeting =
      lower === 'cześć' ||
      lower === 'czesc' ||
      lower === 'cześć.' ||
      lower === 'hej' ||
      lower === 'dzień dobry' ||
      lower === 'dzien dobry' ||
      lower === 'witaj' ||
      lower === 'siema' ||
      lower === 'hello' ||
      lower === 'hi';

    const isHelpInquiry =
      lower.includes('potrzebuję pomocy') ||
      lower.includes('potrzebuje pomocy') ||
      lower.includes('pomóż mi') ||
      lower.includes('pomoz mi');

    const isCapabilityInquiry =
      lower.includes('co potrafisz') ||
      lower.includes('co możesz zrobić') ||
      lower.includes('co mozesz zrobic') ||
      lower.includes('jak działasz') ||
      lower.includes('jak dzialasz') ||
      lower.includes('kim jesteś') ||
      lower.includes('kim jestes');

    if (isPureGreeting || isHelpInquiry || isCapabilityInquiry) {
      return {
        intent: 'CHAT',
        scope: 'PAGE_DESIGN',
        confidence: 0.99,
        reason: 'General conversational inquiry, greeting, or capabilities overview',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 5: INSPECT Intents ("Co widzisz?", "Zobacz ten Hero", "Jak wygląda strona")
    // READ ONLY — NO MUTATION
    // ------------------------------------------------------------------------
    const isInspectQuestion =
      lower === 'co widzisz?' ||
      lower === 'co widzisz' ||
      lower.includes('zobacz ten hero') ||
      lower.includes('zobacz ten') ||
      lower.includes('jak wygląda moja aktualna strona') ||
      lower.includes('jak wygląda teraz moja strona') ||
      lower.includes('jak wyglada teraz moja strona') ||
      lower.includes('jak wyglada moja strona') ||
      lower.includes('co jest w tej sekcji') ||
      lower.includes('co znajduje się w tej sekcji') ||
      lower.includes('jaki element mam zaznaczony') ||
      lower.includes('co jest zaznaczone') ||
      lower.includes('jakie experience jest tutaj użyte') ||
      lower.includes('jakie kolory ma ten hero') ||
      lower.includes('jakie sekcje się na niej znajdują') ||
      lower.includes('przeanalizuj aktualną stronę i powiedz mi') ||
      lower.includes('przeanalizuj stronę') ||
      lower.includes('analiza strony') ||
      lower.startsWith('jaki') ||
      lower.startsWith('jakie') ||
      lower.startsWith('co jest') ||
      lower.startsWith('pokaż sekcje');

    // Make sure it doesn't contain direct write imperative verbs
    const hasWriteImperative =
      lower.includes('zmień') ||
      lower.includes('zmien') ||
      lower.includes('dodaj') ||
      lower.includes('usuń') ||
      lower.includes('usun') ||
      lower.includes('ustaw') ||
      lower.includes('wstaw') ||
      lower.includes('stwórz') ||
      lower.includes('stworz') ||
      lower.includes('zastosuj');

    if (isInspectQuestion && !hasWriteImperative) {
      return {
        intent: 'INSPECT',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'User asks to inspect or read existing builder/visual structure',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 6: Explicit EXECUTE Intents (Direct commands with clear actionable parameters)
    // ------------------------------------------------------------------------
    const isExplicitExecute =
      // Change background / color
      lower.includes('zmień tło') ||
      lower.includes('zmien tlo') ||
      lower.includes('ustaw tło') ||
      lower.includes('ustaw tlo') ||
      lower.includes('czarne tło') ||
      lower.includes('czarne tlo') ||
      // Add Experience / gold gradient + cursor
      (lower.includes('użyj złotego gradientu') && lower.includes('kursor')) ||
      lower.includes('złoty gradient i delikatnej reakcji') ||
      lower.includes('dodaj złoty gradient') ||
      lower.includes('dodaj zloty gradient') ||
      // Motion modulation
      lower.includes('zwiększ delikatnie ruch') ||
      lower.includes('zwieksz delikatnie ruch') ||
      (lower.includes('ruch') && (lower.includes('zwiększ') || lower.includes('zmniejsz'))) ||
      // Section creation
      (lower.includes('hero') && (lower.includes('stwórz') || lower.includes('dodaj') || lower.includes('wstaw'))) ||
      lower.includes('dodaj sekcję') ||
      lower.includes('dodaj sekcje') ||
      lower.includes('dodaj sekcję z korzyściami') ||
      lower.includes('dodaj korzyści') ||
      // Direct prop changes
      lower.includes('zwiększ nagłówek') ||
      lower.includes('zmniejsz nagłówek') ||
      lower.includes('usuń przycisk') ||
      lower.includes('usun przycisk') ||
      lower.includes('usuń sekcję') ||
      lower.includes('usun sekcje');

    if (isExplicitExecute) {
      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'Explicit actionable builder mutation command',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 7: CLARIFY Intents (Vague / Underspecified requests)
    // "Zrób to bardziej premium", "Zrób to lepiej", "Zrób coś z tym", "Popraw to"
    // ------------------------------------------------------------------------
    const isVagueGeneralRequest =
      lower === 'zrób to bardziej premium' ||
      lower === 'zrob to bardziej premium' ||
      lower === 'zrób to lepiej' ||
      lower === 'zrob to lepiej' ||
      lower === 'popraw to' ||
      lower === 'ulepsz to' ||
      lower === 'zrób coś z tym' ||
      lower === 'zrob cos z tym';

    if (isVagueGeneralRequest) {
      return {
        intent: 'CLARIFY',
        scope: 'PAGE_DESIGN',
        confidence: 0.92,
        reason: 'Ambiguous request lacking specific target property or design parameter',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 8: PROPOSE Intents (Advisory / Brainstorming / "Pokaż propozycję")
    // "Co tutaj możemy poprawić?", "Co możemy poprawić w tej sekcji?", "Jak poprawić ten Hero?", "A gdybyśmy zrobili bardziej premium?"
    // ------------------------------------------------------------------------
    const isProposeQuestion =
      lower.includes('jak poprawić') ||
      lower.includes('jak poprawic') ||
      lower.includes('jak można poprawić') ||
      lower.includes('jak mozna poprawic') ||
      lower.includes('jak poprawiłbyś') ||
      lower.includes('jak poprawilbys') ||
      lower.includes('co tutaj możemy poprawić') ||
      lower.includes('co tutaj mozemy poprawic') ||
      lower.includes('co możemy poprawić w tej sekcji') ||
      lower.includes('co mozemy poprawic w tej sekcji') ||
      lower.includes('co możemy poprawić') ||
      lower.includes('co mozemy poprawic') ||
      lower.includes('co jeszcze możemy zrobić') ||
      lower.includes('co jeszcze mozemy zrobic') ||
      lower.includes('a gdybyśmy zrobili bardziej premium') ||
      lower.includes('a gdybysmy zrobili bardziej premium') ||
      lower.includes('jak zrobić bardziej premium') ||
      lower.includes('pokaż propozycję') ||
      lower.includes('pokaz propozycje') ||
      lower.includes('pokaż mi') ||
      lower.includes('pokaz mi') ||
      lower.includes('pokaż pierwszą') ||
      lower.includes('pokaz pierwsza') ||
      lower.includes('co proponujesz') ||
      lower.includes('co byś zmienił') ||
      lower.includes('co bys zmienil') ||
      lower.includes('co sądzisz o tym układzie') ||
      lower.includes('co sadzisz') ||
      lower.includes('ten hero jest trochę pusty') ||
      lower.includes('ten hero jest troche pusty') ||
      lower.includes('masz jakiś pomysł') ||
      lower.includes('masz jakis pomysl');

    if (isProposeQuestion && !hasWriteImperative) {
      return {
        intent: 'PROPOSE',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'User asks for advice, critique, or a design proposal before modifying',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Fallback: If user asked a question (ends with '?') -> CHAT
    // Otherwise, if still ambiguous -> CLARIFY (Never blind mutation!)
    // ------------------------------------------------------------------------
    if (lower.endsWith('?')) {
      return {
        intent: 'CHAT',
        scope: 'PAGE_DESIGN',
        confidence: 0.8,
        reason: 'General inquiry fallback',
      };
    }

    return {
      intent: 'CLARIFY',
      scope: 'PAGE_DESIGN',
      confidence: 0.75,
      reason: 'Unrecognized intent treated safely as CLARIFY without mutating builder',
    };
  }

  /**
   * Resolve contextual pronouns ("to", "ten", "ten Hero", "ta sekcja")
   * to a concrete Builder node ID.
   */
  public static resolveTargetNodeId(
    promptLower: string,
    conversation: HacpConversationContext,
    builderContext: HacpBuilderContext,
    document: BuilderDocument
  ): string | undefined {
    // 1. Direct mention of "hero"
    if (promptLower.includes('hero')) {
      const heroSection = document.pages[0]?.sections.find(
        (s) => s.type === 'hero' || s.label?.toLowerCase().includes('hero')
      );
      if (heroSection) return heroSection.id;
    }

    // 2. Currently selected node in Studio
    if (builderContext.selectedNodeId) {
      return builderContext.selectedNodeId;
    }

    // 3. Last target from conversation memory
    if (conversation.lastTargetNodeId) {
      return conversation.lastTargetNodeId;
    }

    // 4. Default to first section of active page
    return document.pages[0]?.sections[0]?.id;
  }
}
