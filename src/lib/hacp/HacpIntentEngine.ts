/**
 * HacpIntentEngine.ts — Conversational AI Copilot Intent Engine v1.0
 *
 * Implements deterministic 5-mode intent classification:
 * - CHAT:      Casual dialogue, questions, guidance (NO mutation, NO HACP card)
 * - INSPECT:   Query current builder state (READ context, NO mutation, NO HACP card)
 * - PROPOSE:   Advisory recommendations & design ideas (NO mutation, stores lastProposal)
 * - CLARIFY:   Ambiguous / underspecified requests (NO mutation, prompts for details)
 * - EXECUTE:   Explicit mutation command or confirmation of last proposal (HACP mutation)
 */

import type {
  HacpIntentType,
  HacpConversationContext,
  HacpBuilderContext,
  HacpProposal,
  AppliedChangeItem,
} from './HacpTypes';
import type { BuilderDocument, BuilderNode } from '../../../packages/builder-core/src';

export interface IntentClassificationResult {
  intent: HacpIntentType;
  confidence: number;
  reason: string;
  targetNodeId?: string;
  confirmedProposal?: HacpProposal;
  extractedParameters?: Record<string, unknown>;
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
    // Rule 1: Contextual Confirmation of previous PROPOSE
    // "Tak", "Zrób to", "Zastosuj tę propozycję", "Wykonaj", "Zgoda", "Jasne"
    // ------------------------------------------------------------------------
    if (conversation.lastProposal) {
      const isAffirmative =
        lower === 'tak' ||
        lower === 'tak.' ||
        lower === 'tak, zrób to' ||
        lower === 'tak zrób to' ||
        lower === 'zrób to' ||
        lower === 'zrób to.' ||
        lower === 'wykonaj' ||
        lower === 'wykonaj to' ||
        lower === 'zastosuj' ||
        lower === 'zastosuj tę propozycję' ||
        lower === 'zastosuj to' ||
        lower === 'jasne' ||
        lower === 'zgoda' ||
        lower === 'dobra' ||
        lower === 'ok' ||
        lower === 'okej';

      if (isAffirmative) {
        return {
          intent: 'EXECUTE',
          confidence: 0.98,
          reason: 'User explicitly confirmed the previous proposal',
          targetNodeId: conversation.lastProposal.targetNodeId,
          confirmedProposal: conversation.lastProposal,
        };
      }

      // If user asks "Dlaczego?", "A jak to będzie wyglądało?" -> stay in CHAT/PROPOSE discussion
      if (
        lower.startsWith('dlaczego') ||
        lower.includes('czemu') ||
        lower.includes('jak to będzie') ||
        lower.includes('co to da')
      ) {
        return {
          intent: 'CHAT',
          confidence: 0.95,
          reason: 'User asks for rationale or explanation of previous proposal',
          targetNodeId: conversation.lastProposal.targetNodeId,
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule 2: Explicit CHAT Intents (Greetings, help inquiries, capabilities)
    // ------------------------------------------------------------------------
    const isPureGreeting =
      lower === 'cześć' ||
      lower === 'czesc' ||
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
      lower.includes('potrzebuję twojej pomocy') ||
      lower.includes('potrzebuje twojej pomocy') ||
      lower.includes('pomóż mi') ||
      lower.includes('pomoz mi');

    const isCapabilityInquiry =
      lower.includes('co potrafisz') ||
      lower.includes('co możesz zrobić') ||
      lower.includes('co mozesz zrobic') ||
      lower.includes('jak działasz') ||
      lower.includes('jak dzialasz') ||
      lower.includes('jak działa ten builder') ||
      lower.includes('jak dziala ten builder') ||
      lower.includes('opowiedz mi') ||
      lower.includes('kim jesteś') ||
      lower.includes('kim jestes');

    if (isPureGreeting || isHelpInquiry || isCapabilityInquiry) {
      return {
        intent: 'CHAT',
        confidence: 0.99,
        reason: 'General conversational inquiry, greeting, or capabilities overview',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 3: INSPECT Intents (Questions about current state without modification)
    // ------------------------------------------------------------------------
    const isInspectQuestion =
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
        confidence: 0.95,
        reason: 'User asks to inspect or read existing builder structure',
        targetNodeId: builderContext.selectedNodeId,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 4: PROPOSE Intents (Advisory / Brainstorming questions)
    // "Jak można poprawić...", "Co byś zmienił...", "Jak zrobiłbyś bardziej premium..."
    // ------------------------------------------------------------------------
    const isProposeQuestion =
      lower.includes('jak można poprawić') ||
      lower.includes('jak mozna poprawic') ||
      lower.includes('jak poprawiłbyś') ||
      lower.includes('jak poprawilbys') ||
      lower.includes('jak poprawić') ||
      lower.includes('jak poprawic') ||
      lower.includes('co byś zmienił') ||
      lower.includes('co bys zmienil') ||
      lower.includes('co sądzisz o tym układzie') ||
      lower.includes('co sadzisz') ||
      lower.includes('jak zrobiłbyś bardziej premium') ||
      lower.includes('jak zrobilbys bardziej premium') ||
      lower.includes('masz jakiś pomysł') ||
      lower.includes('masz jakis pomysl');

    if (isProposeQuestion && (lower.endsWith('?') || lower.startsWith('jak') || lower.startsWith('co'))) {
      return {
        intent: 'PROPOSE',
        confidence: 0.95,
        reason: 'User asks for advice or design proposals before making changes',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 5: CLARIFY Intents (Underspecified / Ambiguous requests)
    // "Zrób to bardziej premium", "Zrób to lepiej", "Popraw to" without concrete attributes
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
        confidence: 0.92,
        reason: 'Ambiguous request lacking specific target property or design parameter',
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
        confidence: 0.95,
        reason: 'Explicit actionable builder mutation command',
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
        confidence: 0.8,
        reason: 'General inquiry fallback',
      };
    }

    return {
      intent: 'CLARIFY',
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
