/**
 * HacpIntentEngine.ts — Deterministic HACP Command Parser v2.0
 *
 * Parses natural language commands into structured intents WITH extracted parameters.
 * NO LLM, NO NLP framework — pure deterministic keyword + regex extraction.
 *
 * Supported command types:
 * - ADD_SECTION:    "Dodaj sekcję hero", "Dodaj nową sekcję CTA"
 * - UPDATE_TITLE:   "Zmień nagłówek na X", "Ustaw tytuł na X"
 * - ADD_CTA:        "Dodaj przycisk CTA", "Dodaj przycisk Kup teraz"
 * - UPDATE_CTA:     "Zmień tekst przycisku na X", "Zmień kolor CTA na czerwony"
 * - UPDATE_COLOR:   "Zmień kolor tła na #FF0000", "Ustaw kolor na czerwony"
 * - MOVE_SECTION:   "Przesuń sekcję niżej", "Przenieś sekcję wyżej"
 * - DELETE_SECTION: "Usuń tę sekcję", "Usuń zaznaczony element"
 * - UNDO:           "Cofnij", "Wycofaj"
 * - REDO:           "Ponów", "Przywróć"
 */

import type {
  HacpIntentType,
  HacpEngineeringScope,
  HacpConversationContext,
  HacpBuilderContext,
  HacpProposal,
} from './HacpTypes';
import { COLOR_MAP } from './HacpTypes';
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
   * Returns structured intent with extracted parameters.
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
    // Rule 0: UNDO / REDO Intent
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

    const isRedo =
      lower === 'ponów' ||
      lower === 'ponow' ||
      lower === 'ponów to' ||
      lower === 'zrób ponownie' ||
      lower === 'zrob ponownie' ||
      lower === 'przywróć' ||
      lower === 'przywroc' ||
      lower === 'redo';

    if (isRedo) {
      return {
        intent: 'REDO',
        scope: 'PAGE_DESIGN',
        confidence: 0.99,
        reason: 'User explicitly requested to redo',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 1: PLATFORM_ENGINEERING Intent
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
        reason: 'User requested SoloSpot Builder platform development task',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 2: AUDIT & DEBUG Intents
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
        reason: 'User requested a systematic audit',
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
        reason: 'User requested debugging / diagnostics',
        targetNodeId: builderContext.selectedNodeId,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 3: Contextual Confirmation of previous PROPOSE
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
      lower === 'okej' ||
      lower === '1' ||
      lower === 'opcja 1' ||
      lower === 'pierwszy' ||
      lower === 'pierwsza' ||
      lower === '2' ||
      lower === 'opcja 2' ||
      lower === 'drugi' ||
      lower === 'druga' ||
      lower === '3' ||
      lower === 'opcja 3' ||
      lower === 'trzeci' ||
      lower === 'trzecia';

    if (isAffirmative && conversation.lastProposal) {
      let finalProposal = conversation.lastProposal;
      // If proposal had variant options, pick matching variant
      if (lower === '2' || lower === 'drugi' || lower === 'druga') {
        const p2 = (conversation.lastProposal as any).variant2;
        if (p2) finalProposal = p2;
      } else if (lower === '3' || lower === 'trzeci' || lower === 'trzecia') {
        const p3 = (conversation.lastProposal as any).variant3;
        if (p3) finalProposal = p3;
      }

      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.98,
        reason: 'User confirmed previous proposal',
        targetNodeId: finalProposal.targetNodeId,
        confirmedProposal: finalProposal,
      };
    }

    // ------------------------------------------------------------------------
    // Rule 4: CHAT Intents
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
        reason: 'General conversational inquiry',
      };
    }

    // ------------------------------------------------------------------------
    // Rule 5: INSPECT Intents
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
      lower.includes('zastosuj') ||
      lower.includes('przesuń') ||
      lower.includes('przesun') ||
      lower.includes('przenieś') ||
      lower.includes('przenies');

    if (isInspectQuestion && !hasWriteImperative) {
      return {
        intent: 'INSPECT',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'User asks to inspect existing structure',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 6: EXECUTE — DELETE Section
    // "Usuń tę sekcję", "Usuń zaznaczoną sekcję", "Usuń ten element"
    // ------------------------------------------------------------------------
    const isDelete =
      lower.includes('usuń') ||
      lower.includes('usun') ||
      lower.includes('wykasuj') ||
      lower.includes('skasuj');

    if (isDelete) {
      const target = this.resolveTargetNodeId(lower, conversation, builderContext, document);
      if (!target) {
        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.90,
          reason: 'DELETE requested but no target identified — cannot delete without knowing which element',
        };
      }
      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'Explicit delete command with identified target',
        targetNodeId: target,
        extractedParameters: {
          operation: 'DELETE_SECTION',
          sectionId: target,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 7: EXECUTE — MOVE Section
    // "Przesuń sekcję niżej", "Przenieś tę sekcję wyżej"
    // ------------------------------------------------------------------------
    const isMove =
      lower.includes('przesuń') ||
      lower.includes('przesun') ||
      lower.includes('przenieś') ||
      lower.includes('przenies') ||
      lower.includes('przesuń ją') ||
      lower.includes('przesun ja');

    if (isMove) {
      const target = this.resolveTargetNodeId(lower, conversation, builderContext, document);
      if (!target) {
        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.90,
          reason: 'MOVE requested but no target section identified',
        };
      }

      let direction: 'up' | 'down' | undefined;
      if (
        lower.includes('niżej') || lower.includes('nizej') ||
        lower.includes('w dół') || lower.includes('w dol') ||
        lower.includes('na dół') || lower.includes('na dol') ||
        lower.includes('dół') || lower.includes('dol') ||
        lower.includes('pod') || lower.includes('next')
      ) {
        direction = 'down';
      } else if (
        lower.includes('wyżej') || lower.includes('wyzej') ||
        lower.includes('w górę') || lower.includes('w gore') ||
        lower.includes('w gore') || lower.includes('na górę') ||
        lower.includes('na gore') || lower.includes('góra') ||
        lower.includes('gora') || lower.includes('nad') ||
        lower.includes('previous')
      ) {
        direction = 'up';
      }

      if (!direction) {
        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.85,
          reason: 'MOVE requested but direction unclear — specify "niżej" or "wyżej"',
          targetNodeId: target,
        };
      }

      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.94,
        reason: `Explicit move command: direction=${direction}`,
        targetNodeId: target,
        extractedParameters: {
          operation: 'MOVE_SECTION',
          sectionId: target,
          direction,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 8: EXECUTE — UPDATE TITLE / HEADER
    // "Zmień nagłówek na X", "Ustaw tytuł na X", "Zmień tekst nagłówka na X"
    // ------------------------------------------------------------------------
    const isTitleChange =
      lower.includes('nagłówek') ||
      lower.includes('naglowek') ||
      lower.includes('tytuł') ||
      lower.includes('tytul') ||
      lower.includes('header') ||
      lower.includes('title') ||
      lower.includes('heading');

    if (isTitleChange && (lower.includes('zmień') || lower.includes('zmien') || lower.includes('ustaw'))) {
      const extractedText = this.extractQuotedOrAfterNa(lower, prompt);
      if (!extractedText) {
        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.88,
          reason: 'Title change requested but new value not extracted',
          targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        };
      }
      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: `Explicit title update: "${extractedText}"`,
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        extractedParameters: {
          operation: 'UPDATE_TITLE',
          title: extractedText,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 9: EXECUTE — ADD CTA / BUTTON
    // "Dodaj przycisk CTA", "Dodaj przycisk Kup teraz"
    // ------------------------------------------------------------------------
    const isAddButton =
      lower.includes('dodaj przycisk') ||
      lower.includes('dodaj cta') ||
      lower.includes('wstaw przycisk') ||
      lower.includes('stwórz przycisk') ||
      lower.includes('stworz przycisk');

    if (isAddButton) {
      const buttonText = this.extractQuotedOrAfterKeyword(lower, prompt, ['przycisk', 'cta']) || undefined;
      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.94,
        reason: 'Explicit add CTA command',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        extractedParameters: {
          operation: 'ADD_CTA',
          buttonText,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 10: EXECUTE — UPDATE CTA TEXT / COLOR
    // "Zmień tekst przycisku na X", "Zmień kolor przycisku na czerwony"
    // ------------------------------------------------------------------------
    const isUpdateButton =
      (lower.includes('tekst') && (lower.includes('przycisk') || lower.includes('cta'))) ||
      (lower.includes('kolor') && (lower.includes('przycisk') || lower.includes('cta'))) ||
      (lower.includes('zmień') && lower.includes('przycisk')) ||
      (lower.includes('zmien') && lower.includes('przycisk')) ||
      (lower.includes('ustaw') && lower.includes('przycisk'));

    if (isUpdateButton) {
      const target = this.resolveTargetNodeId(lower, conversation, builderContext, document);
      if (!target) {
        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.88,
          reason: 'Button update requested but no target section identified',
        };
      }

      // Check if it's a text change or color change
      if (lower.includes('tekst') || lower.includes('text') || lower.includes('napis')) {
        const extractedText = this.extractQuotedOrAfterNa(lower, prompt);
        if (!extractedText) {
          return {
            intent: 'CLARIFY',
            scope: 'PAGE_DESIGN',
            confidence: 0.85,
            reason: 'Button text change requested but new text not extracted',
            targetNodeId: target,
          };
        }
        return {
          intent: 'EXECUTE',
          scope: 'PAGE_DESIGN',
          confidence: 0.93,
          reason: `Explicit button text update: "${extractedText}"`,
          targetNodeId: target,
          extractedParameters: {
            operation: 'UPDATE_CTA_TEXT',
            text: extractedText,
          },
        };
      }

      if (lower.includes('kolor') || lower.includes('color')) {
        const color = this.extractColor(lower, prompt);
        if (!color) {
          return {
            intent: 'CLARIFY',
            scope: 'PAGE_DESIGN',
            confidence: 0.85,
            reason: 'Button color change requested but color not recognized',
            targetNodeId: target,
          };
        }
        return {
          intent: 'EXECUTE',
          scope: 'PAGE_DESIGN',
          confidence: 0.93,
          reason: `Explicit button color update: ${color}`,
          targetNodeId: target,
          extractedParameters: {
            operation: 'UPDATE_CTA_COLOR',
            color,
          },
        };
      }
    }

    // ------------------------------------------------------------------------
    // Rule 11: EXECUTE — UPDATE COLOR (generic)
    // "Zmień kolor tła na #FF0000", "Ustaw kolor na czerwony"
    // ------------------------------------------------------------------------
    const isColorChange =
      (lower.includes('kolor') || lower.includes('color') || lower.includes('barwa')) &&
      (lower.includes('zmień') || lower.includes('zmien') || lower.includes('ustaw') || lower.includes('na'));

    if (isColorChange) {
      const color = this.extractColor(lower, prompt);
      if (!color) {
        const hasSpecificTargetColor = lower.includes(' na ') || lower.includes(' to ');
        if (!hasSpecificTargetColor && (lower.includes('tło') || lower.includes('tła') || lower.includes('tlo') || lower.includes('tla') || lower.includes('background'))) {
          return {
            intent: 'PROPOSE',
            scope: 'PAGE_DESIGN',
            confidence: 0.95,
            reason: 'User wants to change background color but did not specify color — propose curated palettes',
            targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
            extractedParameters: {
              operation: 'PROPOSE_BACKGROUND',
            },
          };
        }

        return {
          intent: 'CLARIFY',
          scope: 'PAGE_DESIGN',
          confidence: 0.85,
          reason: 'Color change requested but color not recognized. Use hex (#RRGGBB) or name (czerwony, niebieski, etc.)',
          targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        };
      }

      // Determine what property to change
      let property = 'color';
      if (lower.includes('tło') || lower.includes('tła') || lower.includes('tlo') || lower.includes('tla') || lower.includes('background')) {
        property = 'backgroundColor';
      } else if (lower.includes('tekst') || lower.includes('text') || lower.includes('nagłówek') || lower.includes('naglowek')) {
        property = 'textColor';
      } else if (lower.includes('przycisk') || lower.includes('cta') || lower.includes('button')) {
        property = 'buttonColor';
      }

      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.93,
        reason: `Explicit color update: ${color} on ${property}`,
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        extractedParameters: {
          operation: 'UPDATE_COLOR',
          color,
          property,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 12: EXECUTE — ADD SECTION (generic)
    // "Dodaj sekcję hero", "Dodaj nową sekcję", "Dodaj sekcję CTA"
    // ------------------------------------------------------------------------
    const isAddSection =
      lower.includes('dodaj sekcję') ||
      lower.includes('dodaj sekcje') ||
      lower.includes('dodaj nową sekcję') ||
      lower.includes('dodaj nowa sekcje') ||
      lower.includes('wstaw sekcję') ||
      lower.includes('wstaw sekcje') ||
      lower.includes('stwórz sekcję') ||
      lower.includes('stworz sekcje') ||
      lower.includes('utwórz sekcję') ||
      lower.includes('utworz sekcje');

    if (isAddSection) {
      let sectionType = 'hero'; // default
      if (lower.includes('cta') || lower.includes('call to action')) {
        sectionType = 'cta';
      } else if (lower.includes('hero') || lower.includes('banner')) {
        sectionType = 'hero';
      } else if (lower.includes('feature') || lower.includes('korzyś') || lower.includes('korzys')) {
        sectionType = 'feature-grid';
      } else if (lower.includes('kontakt') || lower.includes('contact')) {
        sectionType = 'contact';
      } else if (lower.includes('footer') || lower.includes('stopka')) {
        sectionType = 'footer';
      } else if (lower.includes('galeria') || lower.includes('gallery')) {
        sectionType = 'gallery';
      } else if (lower.includes('testimonial') || lower.includes('opinie')) {
        sectionType = 'testimonials';
      } else if (lower.includes('pricing') || lower.includes('cennik')) {
        sectionType = 'pricing';
      }

      // Determine insertion position
      let position: 'start' | 'end' | undefined;
      if (lower.includes('na górę') || lower.includes('na gore') || lower.includes('na początku') || lower.includes('pierwsza')) {
        position = 'start';
      } else if (lower.includes('na koniec') || lower.includes('na dole') || lower.includes('ostatnia')) {
        position = 'end';
      }

      return {
        intent: 'EXECUTE',
        scope: 'PAGE_DESIGN',
        confidence: 0.94,
        reason: `Explicit add section: type=${sectionType}`,
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
        extractedParameters: {
          operation: 'ADD_SECTION',
          sectionType,
          position,
        },
      };
    }

    // ------------------------------------------------------------------------
    // Rule 13: PROPOSE (Advisory / Brainstorming)
    // ------------------------------------------------------------------------
    const isProposeQuestion =
      lower.includes('jak poprawić') ||
      lower.includes('jak poprawic') ||
      lower.includes('jak można poprawić') ||
      lower.includes('jak mozna poprawic') ||
      lower.includes('co tutaj możemy poprawić') ||
      lower.includes('co tutaj mozemy poprawic') ||
      lower.includes('co możemy poprawić') ||
      lower.includes('co mozemy poprawic') ||
      lower.includes('co jeszcze możemy zrobić') ||
      lower.includes('co jeszcze mozemy zrobic') ||
      lower.includes('pokaż propozycję') ||
      lower.includes('pokaz propozycje') ||
      lower.includes('co proponujesz') ||
      lower.includes('co sądzisz o tym układzie') ||
      lower.includes('co sadzisz') ||
      lower.includes('masz jakiś pomysł') ||
      lower.includes('masz jakis pomysl');

    if (isProposeQuestion && !hasWriteImperative) {
      return {
        intent: 'PROPOSE',
        scope: 'PAGE_DESIGN',
        confidence: 0.95,
        reason: 'User asks for advice or design proposal',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Rule 14: CLARIFY (Vague requests)
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
        reason: 'Ambiguous request lacking specific target or parameter',
        targetNodeId: this.resolveTargetNodeId(lower, conversation, builderContext, document),
      };
    }

    // ------------------------------------------------------------------------
    // Fallback: question → CHAT, unknown → CLARIFY (NEVER mutate!)
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
      reason: 'Unrecognized intent — no mutation without clear parameters',
    };
  }

  // ---------------------------------------------------------------------------
  // Parameter Extraction Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract text after "na " or inside quotes.
   * "Zmień nagłówek na Premium Digital Experience" → "Premium Digital Experience"
   * "Zmień nagłówek na 'Premium Digital Experience'" → "Premium Digital Experience"
   */
  private static extractQuotedOrAfterNa(lower: string, prompt: string): string | null {
    // Try quoted text first: "na 'X'" or "na \"X\""
    const quoteMatch = prompt.match(/na\s+['""](.+?)['""]/i);
    if (quoteMatch) return quoteMatch[1].trim();

    // Try after "na " until end of string or next clause
    const naMatch = prompt.match(/na\s+(.+?)$/i);
    if (naMatch) {
      const value = naMatch[1].trim();
      // Don't return if it's just a word like "na przykład"
      if (value.length > 0 && !value.startsWith('przykład') && !value.startsWith('przyklad')) {
        return value;
      }
    }

    return null;
  }

  /**
   * Extract text after a keyword like "przycisk" or "cta".
   * "Dodaj przycisk Kup teraz" → "Kup teraz"
   * "Dodaj przycisk CTA Kup teraz" → "Kup teraz"
   */
  private static extractQuotedOrAfterKeyword(lower: string, prompt: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      // Match keyword followed by optional whitespace and then the value
      // Use word boundary to avoid partial matches
      const regex = new RegExp(`\\b${keyword}\\b\\s+(.+?)$`, 'i');
      const match = prompt.match(regex);
      if (match) {
        let value = match[1].trim();
        // If value starts with another keyword (like "CTA"), skip it
        for (const skipKw of keywords) {
          if (value.toLowerCase().startsWith(skipKw + ' ')) {
            value = value.slice(skipKw.length).trim();
          }
        }
        if (value.length > 0) return value;
      }
    }
    return null;
  }

  /**
   * Extract color from prompt.
   * Supports: named colors (czerwony, blue), hex (#FF0000, #fff)
   */
  private static extractColor(lower: string, prompt: string): string | null {
    // Try hex color first
    const hexMatch = prompt.match(/#([0-9a-fA-F]{3,8})\b/);
    if (hexMatch) {
      let hex = hexMatch[1];
      // Expand 3-char hex to 6-char
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      if (hex.length === 6) {
        return `#${hex}`;
      }
    }

    // Try named colors
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
      if (lower.includes(name)) {
        return hex;
      }
    }

    return null;
  }

  /**
   * Resolve contextual pronouns to a concrete Builder node ID.
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

    // 4. No explicit target — return undefined (callers decide fallback)
    return undefined;
  }
}
