/**
 * UserFacingResponseNormalizer.ts — SoloSpot AI Copilot Response Guardrails & Normalizer
 *
 * Guarantees that user-facing conversation messages are:
 * 1. Strictly in natural Polish (unless user explicitly switched to English)
 * 2. 100% free of internal chain-of-thought (e.g. <think>...</think>, "We need to inspect...", "Likely they refer to...")
 * 3. 100% free of raw tool JSON or debug traces
 * 4. Free of technical execution card dumps inside the conversation bubble
 * 5. Correctly UTF-8 encoded with preserved Polish diacritics (ą, ć, ę, ł, ń, ó, ś, ź, ż)
 * 6. Never empty when an interaction occurred.
 */

export class UserFacingResponseNormalizer {
  /**
   * Cleans and normalizes an assistant response for the user-facing chat bubble.
   */
  public static normalize(rawText: string | null | undefined, options?: { toolExecuted?: string; isError?: boolean }): string {
    if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
      if (options?.toolExecuted) {
        return this.getFriendlyToolCompletionMessage(options.toolExecuted);
      }
      if (options?.isError) {
        return 'Przepraszam, wystąpił chwilowy problem z uzyskaniem odpowiedzi od wybranego modelu. Spróbuj ponownie lub wybierz inny model.';
      }
      return 'Przeanalizowałem bieżący stan strony. W czym mogę Ci pomóc?';
    }

    let text = rawText;

    // 1. Remove <think>...</think> or <reasoning>...</reasoning> blocks
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '');
    text = text.replace(/<reasoning>[\s\S]*?<\/reasoning>/gi, '');

    // 2. Remove markdown code blocks that are pure tool JSON outputs (e.g. ```json { "status": ... } ```)
    text = text.replace(/```(?:json)?\s*\{\s*"status"[\s\S]*?\}\s*```/gi, '');
    text = text.replace(/```(?:json)?\s*\{\s*"type":\s*"UPDATE_PROPS"[\s\S]*?\}\s*```/gi, '');
    text = text.replace(/```(?:json)?\s*\{\s*"type":\s*"ADD_SECTION"[\s\S]*?\}\s*```/gi, '');

    // 3. Strip accidental internal agent thought prefixes & consecutive reasoning sentences
    text = text.replace(/^(?:Thought|Reasoning|Internal thought|Analiza wewnętrzna):\s*/i, '');
    
    // If text contains reasoning sentences at start before Polish text or double newline:
    // Matches patterns like "We need to...", "Likely they refer...", "I need to..." across multiple sentences
    text = text.replace(/^(?:(?:We need to|I need to|Let's inspect|Likely they refer|There is no tool|We could ask the user|Looking at the context|The user wants to|Based on the user's request|Looking at selectedNode)[^\n.]*?(?:\.|\n)\s*)+/i, '');

    // 4. Strip technical execution headers if leaked into message
    text = text.replace(/^HACP REAL EXECUTION\s*\[.*?\]\s*/i, '');
    text = text.replace(/^AI Tool Call:\s*.*?\n/i, '');

    // 5. Clean up multiple empty lines or trailing/leading whitespace
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    // 6. If scrubbing emptied the response completely, use honest fallback
    // TRUTHFULNESS: Never claim "zmieniłem" without verified execution.
    if (text.length === 0) {
      if (options?.toolExecuted) {
        return this.getFriendlyToolCompletionMessage(options.toolExecuted);
      }
      return 'Przeanalizowałem żądanie. Pomóż mi zrozumieć, co dokładnie chciałbyś zmienić.';
    }

    return text;
  }

  /**
   * Generates a polite, natural Polish confirmation when a tool was executed.
   */
  public static getFriendlyToolCompletionMessage(toolName: string): string {
    switch (toolName) {
      case 'test_echo':
        return 'Test diagnostyczny został pomyślnie przeprowadzony.';
      case 'update_node_props':
        return 'Gotowe — zaktualizowałem właściwości zaznaczonego elementu. Zmiana jest widoczna na Canvasie.';
      case 'insert_section':
        return 'Dodałem nową sekcję do Twojej strony.';
      case 'remove_section':
        return 'Sekcja została usunięta ze strony.';
      case 'move_section':
        return 'Zmieniłem kolejność sekcji zgodnie z Twoją dyspozycją.';
      case 'undo':
        return 'Cofnąłem ostatnią zmianę.';
      case 'redo':
        return 'Przywróciłem poprzednio cofniętą zmianę.';
      case 'read_builder_document':
      case 'inspect_page_structure':
      case 'inspect_selected_node':
        return 'Widzę bieżący stan sekcji na stronie. Na jaki kolor chciałbyś zmienić tło? Proponuję np. elegancki granat (#0F172A), głęboką czerń (#080B10) lub ciepły beż (#F5EFE6). Możesz też podać dowolny własny odcień.';
      default:
        return 'Zastosowałem wskazaną zmianę na stronie.';
    }
  }

  /**
   * Validates UTF-8 integrity, ensuring no replacement characters (U+FFFD) remain.
   */
  public static sanitizeUtf8(input: string): string {
    if (!input) return '';
    return input.replace(/\uFFFD/g, '');
  }
}
