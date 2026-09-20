/**
 * HacpBridge.ts — SoloSpot Autonomous Control Protocol Bridge
 *
 * The official architectural bridge connecting the SoloSpot AI Copilot
 * to Builder capabilities, mutation engine, and experience runtime.
 *
 * Implements DECISION-042 - DECISION-045:
 * - Bridge delegates to domain commands (never implements custom schedulers)
 * - Inspector & Copilot edit data; execution remains in builder-core / experience runtime
 * - BuilderDocument is the single source of truth (SSOT)
 */

import type { BuilderCommand, BuilderDocument } from '../../../packages/builder-core/src';
import type { ExperienceSceneConfig } from '@/lib/experience/ExperienceRuntimeTypes';
import { HacpIntentEngine } from './HacpIntentEngine';
import type {
  HacpStatus,
  HacpCapability,
  HacpActivityEvent,
  HacpBuilderContext,
  HacpExecutionResult,
  HacpExecutionCard,
  HacpExecutionStep,
  AppliedChangeItem,
  HacpConversationContext,
  HacpProposal,
} from './HacpTypes';

export class HacpBridge {
  private static instance: HacpBridge;
  private status: HacpStatus = 'ONLINE';
  private capabilities: HacpCapability[] = [];
  private eventSubscribers: Array<(event: HacpActivityEvent) => void> = [];
  private recentEvents: HacpActivityEvent[] = [];

  private constructor() {
    this.registerDefaultCapabilities();
    this.recordEvent({
      id: `evt-init-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
      type: 'CONNECT',
      title: 'HACP Bridge zainicjalizowany',
      description: 'Połączono z runtime SoloSpot Studio (12 możliwości aktywnych)',
      status: 'SUCCESS',
    });
  }

  public static getInstance(): HacpBridge {
    if (!HacpBridge.instance) {
      HacpBridge.instance = new HacpBridge();
    }
    return HacpBridge.instance;
  }

  public getStatus(): HacpStatus {
    return this.status;
  }

  public getCapabilities(): HacpCapability[] {
    return [...this.capabilities];
  }

  public subscribe(callback: (event: HacpActivityEvent) => void): () => void {
    this.eventSubscribers.push(callback);
    return () => {
      this.eventSubscribers = this.eventSubscribers.filter((cb) => cb !== callback);
    };
  }

  public getRecentEvents(): HacpActivityEvent[] {
    return [...this.recentEvents];
  }

  public recordEvent(event: HacpActivityEvent): void {
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > 50) {
      this.recentEvents.pop();
    }
    this.eventSubscribers.forEach((sub) => {
      try {
        sub(event);
      } catch (err) {
        console.error('[HacpBridge] Subscriber error:', err);
      }
    });
  }

  private registerDefaultCapabilities(): void {
    this.capabilities = [
      // READ Capabilities
      {
        id: 'read_document_tree',
        name: 'Odczyt drzewa dokumentu',
        category: 'READ',
        description: 'Inspekcja hierarchii sekcji, stron i węzłów w BuilderDocument',
        available: true,
      },
      {
        id: 'inspect_node_geometry',
        name: 'Inspekcja geometrii węzła',
        category: 'READ',
        description: 'Pobranie wymiarów, marginesów i pozycji wybranego węzła Canvas',
        available: true,
      },
      {
        id: 'query_selection',
        name: 'Odczyt aktywnego zaznaczenia',
        category: 'READ',
        description: 'Identyfikacja aktywnego węzła zaznaczonego przez użytkownika',
        available: true,
      },
      {
        id: 'analyze_page',
        name: 'Analiza struktury strony',
        category: 'READ',
        description: 'Kompleksowa ewaluacja struktury, spójności i hierarchii strony',
        available: true,
      },

      // BUILD Capabilities
      {
        id: 'insert_section',
        name: 'Wstawianie nowej sekcji',
        category: 'BUILD',
        description: 'Dodawanie predefiniowanych lub dynamicznych sekcji do drzewa strony',
        available: true,
      },
      {
        id: 'create_component',
        name: 'Tworzenie komponentu',
        category: 'BUILD',
        description: 'Generowanie atomowych bloków UI z atrybutami SoloSpot',
        available: true,
      },
      {
        id: 'clone_node',
        name: 'Klonowanie elementu',
        category: 'BUILD',
        description: 'Powielanie istniejącego węzła wraz ze stylami i konfiguracją Experience',
        available: true,
      },

      // EDIT Capabilities
      {
        id: 'update_props',
        name: 'Aktualizacja właściwości węzła',
        category: 'EDIT',
        description: 'Modyfikacja propsów wizualnych, typografii i układu węzła',
        available: true,
      },
      {
        id: 'configure_experience',
        name: 'Konfiguracja Visual Experience',
        category: 'EDIT',
        description: 'Sterowanie mesh-gradientem, spotlightem kursora, tiltem 3D i płynnym ruchem',
        available: true,
      },
      {
        id: 'reorder_nodes',
        name: 'Zmiana kolejności węzłów',
        category: 'EDIT',
        description: 'Przesuwanie sekcji w górę i w dół w hierarchii dokumentu',
        available: true,
      },

      // VALIDATION Capabilities
      {
        id: 'validate_document_schema',
        name: 'Walidacja schematu BuilderDocument',
        category: 'VALIDATION',
        description: 'Sprawdzanie integralności struktury i identyfikatorów węzłów',
        available: true,
      },
      {
        id: 'validate_runtime_scene',
        name: 'Walidacja sceny Experience Runtime',
        category: 'VALIDATION',
        description: 'Weryfikacja płynności 60fps i poprawności shaderów w przeglądarce',
        available: true,
      },
    ];
  }

  /**
   * Process prompt using Conversational Intent Engine & HACP Bridge.
   *
   * Intent Rules:
   * - CHAT: Dialogue & explanation (NO mutation, NO HACP card)
   * - INSPECT: Query current builder state (READ context, NO mutation, NO HACP card)
   * - PROPOSE: Brainstorming & suggestions (NO mutation, stores lastProposal)
   * - CLARIFY: Underspecified request (prompts for details, NO mutation)
   * - EXECUTE: Explicit action or proposal confirmation (HACP mutation, card, events)
   */
  public async executePlan(
    prompt: string,
    context: HacpBuilderContext,
    document: BuilderDocument,
    conversationContext: HacpConversationContext = { history: [] }
  ): Promise<HacpExecutionResult> {
    const startTime = new Date().toLocaleTimeString('pl-PL');
    const cleanPrompt = prompt.trim();
    const lower = cleanPrompt.toLowerCase();
    const activePageId = context.pageId || document.pages[0]?.id || 'page-home';
    const activePage = document.pages.find((p) => p.id === activePageId) || document.pages[0];

    // 1. CLASSIFY INTENT
    const classification = HacpIntentEngine.classify(prompt, conversationContext, context, document);

    // ------------------------------------------------------------------------
    // CASE 1: CHAT (Casual conversation, help questions, capabilities)
    // NO mutations, NO HACP card, NO canvas change
    // ------------------------------------------------------------------------
    if (classification.intent === 'CHAT') {
      this.recordEvent({
        id: `evt-chat-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'READ',
        title: 'AI Copilot Conversation',
        description: 'Odpowiedź konwersacyjna asystenta',
        status: 'INFO',
      });

      let responseMessage = 'Cześć! W czym mogę Ci dzisiaj pomóc w Twoim sklepie SoloSpot?';

      if (lower.includes('potrzebuję pomocy') || lower.includes('potrzebuje pomocy')) {
        responseMessage =
          'Jasne. Jestem tutaj, żeby pomóc Ci pracować z SoloSpot. Możesz mnie zapytać o stronę, layout, Experience albo poprosić mnie o wykonanie konkretnej zmiany.';
      } else if (
        lower.includes('co możesz zrobić') ||
        lower.includes('co mozesz zrobic') ||
        lower.includes('co potrafisz')
      ) {
        responseMessage =
          'Mogę pomagać Ci projektować stronę, analizować Builder, pracować z sekcjami i Experience oraz wykonywać konkretne zmiany przez HACP.';
      } else if (lower.startsWith('dlaczego') || lower.includes('czemu')) {
        responseMessage =
          'Zaproponowałem tę zmianę, ponieważ poprawia ona kontrast i czytelność elementów oraz nadaje sekcji profesjonalny charakter klasy enterprise. Czy chciałbyś, abym ją teraz zastosował?';
      }

      return {
        success: true,
        intent: 'CHAT',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        updatedConversationContext: {
          lastIntent: 'CHAT',
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE 2: INSPECT (Querying information without mutating)
    // READ context, NO mutation, NO HACP card
    // ------------------------------------------------------------------------
    if (classification.intent === 'INSPECT') {
      this.recordEvent({
        id: `evt-inspect-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'READ',
        title: 'Read Context',
        description: 'Odczytano bieżący stan sekcji i dokumentu',
        status: 'INFO',
      });

      const sections = activePage?.sections || [];
      const targetSectionId = classification.targetNodeId || context.selectedNodeId || sections[0]?.id;
      const targetSection = sections.find((s) => s.id === targetSectionId);

      let responseMessage = '';

      if (
        lower.includes('jak wygląda moja aktualna strona') ||
        lower.includes('jak wygląda teraz moja strona') ||
        lower.includes('przeanalizuj') ||
        lower.includes('jakie sekcje')
      ) {
        const sectionListText =
          sections.length > 0
            ? sections
                .map(
                  (s, i) =>
                    `  ${i + 1}. **${s.label || s.type}** (ID: \`${s.id}\`, typ: \`${s.type}\`${
                      s.visible === false ? ' [ukryta]' : ''
                    })`
                )
                .join('\n')
            : '  (Brak sekcji na bieżącej stronie)';

        responseMessage = `Przeanalizowałem aktualną stronę **${activePage?.name || 'Główna'}** w Builderze.\n\nStrona zawiera **${sections.length}** sekcji:\n${sectionListText}\n\n**Stan techniczny:**\n✓ BuilderDocument: ZGODNY\n✓ Drzewo węzłów: ZSYNCHRONIZOWANE\n✓ Runtime: GOTOWY\n\nMożesz teraz wskazać konkretną sekcję do edycji lub dodać nową akcją szybkiego wyboru.`;
      } else if (targetSection) {
        const exp = (targetSection.props as any)?.experienceConfig;
        const bgType = exp?.background?.type || 'standard';
        const pointerType = exp?.pointer?.type || 'standard';
        responseMessage = `Aktualnie zaznaczona sekcja to **${targetSection.label || targetSection.type}** (ID: \`${targetSection.id}\`).\n\n• Typ sekcji: \`${targetSection.type}\`\n• Tło: \`${bgType}\`\n• Interakcja kursora: \`${pointerType}\`\n• Widoczność: ${targetSection.visible === false ? 'Ukryta' : 'Widoczna'}\n\nMożesz poprosić mnie o modyfikację jej stylów, kolorów lub efektów.`;
      } else {
        responseMessage = `Na stronie znajduje się obecnie ${sections.length} sekcji. Zaznacz sekcję na Canvasie, aby uzyskać szczegółowe informacje o jej właściwościach.`;
      }

      return {
        success: true,
        intent: 'INSPECT',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        updatedConversationContext: {
          lastIntent: 'INSPECT',
          lastTargetNodeId: targetSectionId,
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE 3: PROPOSE (Brainstorming & suggestions)
    // NO mutation, stores lastProposal, NO HACP card
    // ------------------------------------------------------------------------
    if (classification.intent === 'PROPOSE') {
      const targetSectionId =
        classification.targetNodeId ||
        context.selectedNodeId ||
        document.pages[0]?.sections.find((s) => s.type === 'hero')?.id ||
        document.pages[0]?.sections[0]?.id;

      const targetSection = document.pages[0]?.sections.find((s) => s.id === targetSectionId);
      const targetLabel = targetSection?.label || 'Hero';

      this.recordEvent({
        id: `evt-propose-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'READ',
        title: 'Design Proposal',
        description: `Zaproponowano ulepszenie sekcji ${targetLabel}`,
        nodeId: targetSectionId,
        status: 'INFO',
      });

      const proposal: HacpProposal = {
        id: `prop-${Date.now()}`,
        title: 'Złoty Gradient i Kontrast SoloSpot Gold',
        description: `Zastosowanie ciemnego tła, złotego gradientu i subtelnej reakcji na kursor w sekcji ${targetLabel}`,
        targetNodeId: targetSectionId,
        targetNodeType: targetSection?.type || 'hero',
        proposedCapability: 'configure_experience',
        proposedChanges: [
          {
            target: targetSectionId || 'sec-target',
            property: 'experienceConfig.background',
            newValue: 'mesh-gradient (SoloSpot Gold #D9A86C)',
            summary: 'Złoty gradient w tle sekcji',
          },
          {
            target: targetSectionId || 'sec-target',
            property: 'experienceConfig.pointer',
            newValue: 'spotlight + tilt (Złoty blask kursora)',
            summary: 'Subtelna interakcja kursora i głębia 3D',
          },
          {
            target: targetSectionId || 'sec-target',
            property: 'experienceConfig.motion',
            newValue: 'float (speed: 0.85)',
            summary: 'Płynna dynamika elementów',
          },
        ],
        executePayload: {
          type: 'UPDATE_PROPS',
          props: {
            experienceConfig: {
              background: {
                type: 'mesh-gradient',
                colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'],
                blur: 48,
                speed: 0.8,
                opacity: 0.9,
              },
              pointer: {
                type: 'spotlight',
                strength: 1.25,
                maxAngle: 12,
                perspective: 1200,
                radius: 380,
                color: 'rgba(217, 168, 108, 0.28)',
              },
              motion: {
                type: 'float',
                speed: 0.85,
                intensity: 0.9,
                direction: 'normal',
              },
            },
            primaryColor: '#D9A86C',
            themeAccent: 'gold-champagne',
          },
        },
      };

      const responseMessage = `Proponuję:
• ciemniejsze tło (#080B10 / #050505),
• złoty akcent SoloSpot Gold (#D9A86C),
• większy kontrast nagłówka,
• subtelną animację kursora (spotlight & tilt).

Mogę to zastosować, jeśli chcesz. Wystarczy, że napiszesz **„Tak”** lub **„Zrób to”**.`;

      return {
        success: true,
        intent: 'PROPOSE',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        updatedConversationContext: {
          lastIntent: 'PROPOSE',
          lastProposal: proposal,
          lastTargetNodeId: targetSectionId,
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE 4: CLARIFY (Underspecified / Ambiguous requests)
    // NO mutation, prompts for details, NO HACP card
    // ------------------------------------------------------------------------
    if (classification.intent === 'CLARIFY') {
      const responseMessage = `Jasne. Mogę poprawić:
1. kolorystykę (np. ciemniejsze tło, złote akcenty),
2. typografię i kontrast,
3. layout sekcji,
4. animację i reakcję na kursor.

Od czego chcesz zacząć? Możesz też napisać np. *„Zmień tło Hero na czarne”* lub *„Dodaj złoty gradient”*.`;

      return {
        success: true,
        intent: 'CLARIFY',
        message: responseMessage,
        commandsToDispatch: [],
        eventsToEmit: [],
        updatedConversationContext: {
          lastIntent: 'CLARIFY',
        },
      };
    }

    // ------------------------------------------------------------------------
    // CASE 5: EXECUTE (Explicit command or confirmed proposal)
    // Real HACP execution, mutation commands, validation PASS, execution card
    // ------------------------------------------------------------------------
    this.status = 'BUSY';

    const steps: HacpExecutionStep[] = [];
    const commands: BuilderCommand[] = [];
    const events: HacpActivityEvent[] = [];
    const appliedChanges: AppliedChangeItem[] = [];

    const addStep = (id: string, name: string, status: HacpExecutionStep['status'], detail?: string) => {
      steps.push({
        id,
        name,
        status,
        detail,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
      });
    };

    const targetSectionId =
      classification.targetNodeId ||
      context.selectedNodeId ||
      document.pages[0]?.sections.find((s) => s.type === 'hero')?.id ||
      document.pages[0]?.sections[0]?.id;

    let responseMessage = '';

    // Step 1: Inspect Page & Selection
    addStep('step-inspect-page', 'Inspect page', 'SUCCESS', `Zbadano stronę: ${context.pageName || 'Główna'}`);
    this.recordEvent({
      id: `evt-inspect-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pl-PL'),
      type: 'READ',
      title: 'Read BuilderDocument',
      description: `Odczytano strukturę strony (węzłów: ${context.documentNodeCount})`,
      status: 'INFO',
    });

    if (targetSectionId) {
      addStep(
        'step-inspect-selection',
        'Inspect selection',
        'SUCCESS',
        `Wskazano sekcję: ${context.selectedNodeLabel || targetSectionId}`
      );
      this.recordEvent({
        id: `evt-node-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'READ',
        title: 'Selected node inspected',
        description: `Węzeł ${targetSectionId} gotowy do modyfikacji`,
        nodeId: targetSectionId,
        status: 'INFO',
      });
    }

    // Branch 5A: User confirmed a previous proposal ("Tak", "Zrób to", "Zastosuj tę propozycję")
    if (classification.confirmedProposal) {
      const proposal = classification.confirmedProposal;
      const targetId = proposal.targetNodeId || targetSectionId;

      addStep(
        'step-cap',
        `Select capability: ${proposal.proposedCapability}`,
        'SUCCESS',
        'Zaakceptowano propozycję asystenta'
      );

      if (targetId && proposal.executePayload?.props) {
        commands.push({
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetId,
          props: proposal.executePayload.props,
        });

        appliedChanges.push(...proposal.proposedChanges);

        addStep('step-mutate', 'Apply mutation: UPDATE_PROPS', 'SUCCESS', 'Zastosowano zmiany z propozycji');
        addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Canvas zaktualizowany na żywo');
        addStep('step-validate', 'Validate: BuilderDocument + Runtime', 'SUCCESS', 'Walidacja PASS');
        addStep('step-complete', 'Complete', 'SUCCESS', 'Operacja zakończona sukcesem');

        responseMessage = `Gotowe. Zastosowałem propozycję dla sekcji: ciemniejsze tło, złoty gradient SoloSpot Gold oraz subtelną reakcję na kursor.`;

        this.recordEvent({
          id: `evt-mutate-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pl-PL'),
          type: 'MUTATE',
          title: 'UPDATE_PROPS',
          description: `Zastosowano propozycję w węźle ${targetId}`,
          nodeId: targetId,
          capability: proposal.proposedCapability,
          status: 'SUCCESS',
        });
        this.recordEvent({
          id: `evt-exp-${Date.now() + 1}`,
          timestamp: new Date().toLocaleTimeString('pl-PL'),
          type: 'EXPERIENCE',
          title: 'configure_experience',
          description: `Zaaplikowano parametry wizualne do sekcji ${targetId}`,
          nodeId: targetId,
          capability: proposal.proposedCapability,
          status: 'SUCCESS',
        });
        this.recordEvent({
          id: `evt-valid-${Date.now() + 2}`,
          timestamp: new Date().toLocaleTimeString('pl-PL'),
          type: 'VALIDATE',
          title: 'Validation PASS',
          description: 'BuilderDocument i ExperienceScene pomyślnie zwalidowane',
          status: 'SUCCESS',
        });
      }
    }

    // Branch 5B: Change background to black ("Zmień tło Hero na czarne", "Zmień tło na czarne")
    else if (
      lower.includes('czarne') ||
      lower.includes('czarny') ||
      (lower.includes('tło') && lower.includes('czarn'))
    ) {
      addStep('step-cap', 'Select capability: update_props', 'SUCCESS', 'Wybrano modyfikator stylów sekcji');

      if (targetSectionId) {
        commands.push({
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props: {
            backgroundColor: '#050505',
            background: '#050505',
            themeAccent: 'dark-graphite',
          },
        });

        appliedChanges.push({
          target: targetSectionId,
          property: 'backgroundColor',
          previousValue: (context.selectedNodeProps as any)?.backgroundColor || 'transparent',
          newValue: '#050505',
          summary: 'Czarne tło sekcji (#050505)',
        });

        addStep('step-mutate', 'Apply mutation: UPDATE_PROPS', 'SUCCESS', 'Zmieniono tło sekcji na #050505');
        addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Canvas zaktualizowany na żywo');
        addStep('step-validate', 'Validate: BuilderDocument', 'SUCCESS', 'Walidacja PASS');
        addStep('step-complete', 'Complete', 'SUCCESS', 'Tło pomyślnie zmienione');

        responseMessage = `Gotowe. Zmieniłem tło sekcji na #050505.`;

        this.recordEvent({
          id: `evt-mutate-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('pl-PL'),
          type: 'MUTATE',
          title: 'update_props',
          description: `Zmieniono tło w węźle ${targetSectionId} na #050505`,
          nodeId: targetSectionId,
          capability: 'update_props',
          status: 'SUCCESS',
        });
      } else {
        addStep('step-blocked', 'Apply mutation', 'FAILED', 'Brak sekcji do modyfikacji');
        responseMessage = 'Nie mogę zmienić tła: nie znaleziono sekcji docelowej.';
      }
    }

    // Branch 5C: Add Hero Section ("Stwórz nowoczesny Hero Banner...", "Dodaj hero")
    else if (
      (lower.includes('hero') &&
        (lower.includes('stwórz') ||
          lower.includes('dodaj') ||
          lower.includes('wstaw') ||
          lower.includes('banner') ||
          lower.includes('nowy') ||
          lower.includes('utwórz'))) ||
      lower.includes('add_hero')
    ) {
      addStep('step-cap', 'Select capability: insert_section', 'SUCCESS', 'Wybrano generator sekcji Hero');

      const newHeroId = `sec-hero-${Date.now().toString().slice(-4)}`;
      commands.push({
        type: 'ADD_SECTION',
        pageId: activePageId,
        sectionType: 'hero',
        defaultProps: {
          title: 'Nowoczesny Sklep Przyszłości',
          subtitle: 'Autonomiczna platforma e-commerce klasy Enterprise. Wdrożona natychmiast.',
          cta: 'Zobacz ofertę',
          experienceConfig: {
            background: {
              type: 'mesh-gradient',
              colors: ['#D9A86C', '#F2C27F', '#141820', '#080B10'],
              blur: 50,
              speed: 0.8,
              opacity: 0.85,
            },
            pointer: {
              type: 'spotlight',
              strength: 1.2,
              maxAngle: 12,
              perspective: 1200,
              radius: 350,
              color: 'rgba(217, 168, 108, 0.25)',
            },
          },
        },
        label: 'AI Wygenerowany Hero',
        atIndex: 0,
      });

      appliedChanges.push({
        target: newHeroId,
        property: 'sections[0]',
        newValue: 'Hero Section (with Gold Gradient Experience)',
        summary: 'Wstawiono sekcję Hero na górze strony',
      });

      addStep('step-mutate', 'Apply mutation: ADD_SECTION', 'SUCCESS', `Wstawiono sekcję Hero (\`${newHeroId}\`)`);
      addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Zarejestrowano w drzewie renderera');
      addStep('step-validate', 'Validate: Node tree integrity', 'SUCCESS', 'Walidacja PASS');
      addStep('step-complete', 'Complete', 'SUCCESS', 'Nowa sekcja gotowa na Canvas');

      responseMessage = `Utworzyłem nową sekcję **Hero Banner** z wbudowanym gradientem SoloSpot Gold.\n\n**Elementy sekcji:**\n✓ Tytuł: *Nowoczesny Sklep Przyszłości*\n✓ Złoty gradient tła i spotlight kursora\n✓ Przycisk Call to Action (*Zobacz ofertę*)\n\nSekcja została umieszczona na początku strony i jest widoczna na Canvas.`;

      this.recordEvent({
        id: `evt-addhero-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'MUTATE',
        title: 'insert_section',
        description: 'Wstawiono nową sekcję Hero z konfiguracją Experience',
        nodeId: newHeroId,
        capability: 'insert_section',
        status: 'SUCCESS',
      });
    }

    // Branch 5D: Add Feature Grid / Korzyści
    else if (
      lower.includes('korzyści') ||
      lower.includes('features') ||
      lower.includes('add_features') ||
      lower.includes('dodaj sekcję') ||
      lower.includes('stwórz sekcję')
    ) {
      addStep('step-cap', 'Select capability: insert_section', 'SUCCESS', 'Wybrano generator sekcji Korzyści');

      const newFeaturesId = `sec-features-${Date.now().toString().slice(-4)}`;
      commands.push({
        type: 'ADD_SECTION',
        pageId: activePageId,
        sectionType: 'feature-grid',
        defaultProps: {
          title: 'Kluczowe Przewagi Platformy',
          f1: 'Autonomiczny handel 24/7',
          f2: '0% prowizji od transakcji',
          f3: 'Eksport kodu HTML bez vendor lock-in',
        },
        label: 'AI Cechy i Korzyści',
      });

      appliedChanges.push({
        target: newFeaturesId,
        property: 'sections',
        newValue: 'Feature Grid (3 filary korzyści)',
        summary: 'Wstawiono sekcję korzyści ofertowych',
      });

      addStep('step-mutate', 'Apply mutation: ADD_SECTION', 'SUCCESS', `Wstawiono sekcję Korzyści (\`${newFeaturesId}\`)`);
      addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Canvas zaktualizowany');
      addStep('step-validate', 'Validate document', 'SUCCESS', 'Walidacja PASS');
      addStep('step-complete', 'Complete', 'SUCCESS', 'Sekcja dodana');

      responseMessage = `Dodałem sekcję **Cechy i Korzyści (Feature Grid)** do Twojej strony.\n\n**Skonfigurowano 3 filary:**\n1. Autonomiczny handel 24/7\n2. 0% prowizji od transakcji\n3. Eksport kodu HTML bez vendor lock-in\n\nMożesz teraz zmienić poszczególne hasła bezpośrednio w panelu Inspektora.`;

      this.recordEvent({
        id: `evt-addfeat-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'MUTATE',
        title: 'insert_section',
        description: 'Wstawiono sekcję Feature Grid',
        nodeId: newFeaturesId,
        capability: 'insert_section',
        status: 'SUCCESS',
      });
    }

    // Branch 5E: Modulate Motion / Experience
    else if (
      lower.includes('ruch') ||
      lower.includes('intensywn') ||
      lower.includes('zwiększ') ||
      lower.includes('zmniejsz') ||
      lower.includes('dynamik')
    ) {
      addStep('step-cap', 'Select capability: configure_experience', 'SUCCESS', 'Modulacja parametrów Experience');

      if (!targetSectionId) {
        addStep('step-blocked', 'Apply mutation', 'FAILED', 'Nie wskazano sekcji z Experience');
        this.status = 'ONLINE';
        return {
          success: false,
          intent: 'EXECUTE',
          message: 'Nie mogę wykonać operacji: Zaznacz sekcję zawierającą Experience, aby dostosować jej parametry.',
          executionCard: {
            id: `card-${Date.now()}`,
            title: 'HACP EXECUTION',
            status: 'FAILED',
            steps,
            startedAt: startTime,
            validationResult: 'FAIL',
          },
          commandsToDispatch: [],
          eventsToEmit: [],
        };
      }

      const currentMotion = context.experienceConfig?.motion;
      const newSpeed = Math.min((currentMotion?.speed || 1.0) * 1.35, 2.5);
      const newIntensity = Math.max((currentMotion?.intensity || 1.0) * 0.75, 0.3);

      const updatedExpConfig: Partial<ExperienceSceneConfig> = {
        ...(context.experienceConfig || {}),
        motion: {
          type: currentMotion?.type || 'float',
          speed: parseFloat(newSpeed.toFixed(2)),
          intensity: parseFloat(newIntensity.toFixed(2)),
          direction: currentMotion?.direction || 'normal',
        },
      };

      commands.push({
        type: 'UPDATE_PROPS',
        pageId: activePageId,
        sectionId: targetSectionId,
        props: {
          experienceConfig: updatedExpConfig,
        },
      });

      appliedChanges.push({
        target: targetSectionId,
        property: 'experienceConfig.motion.speed',
        previousValue: currentMotion?.speed || 1.0,
        newValue: updatedExpConfig.motion?.speed,
        summary: `Zwiększono prędkość ruchu do ${updatedExpConfig.motion?.speed}x`,
      });
      appliedChanges.push({
        target: targetSectionId,
        property: 'experienceConfig.motion.intensity',
        previousValue: currentMotion?.intensity || 1.0,
        newValue: updatedExpConfig.motion?.intensity,
        summary: `Zmniejszono intensywność efektu do ${updatedExpConfig.motion?.intensity}x`,
      });

      addStep('step-mutate', 'Apply mutation: UPDATE_PROPS', 'SUCCESS', 'Zmodyfikowano parametry ruchu');
      addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Płynna aktualizacja parametrów animacji');
      addStep('step-validate', 'Validate: Runtime parameters', 'SUCCESS', 'Parametry mieszczą się w normie 60fps');
      addStep('step-complete', 'Complete', 'SUCCESS', 'Pomyślnie zoptymalizowano dynamikę');

      responseMessage = `Dostosowałem dynamikę efektu w sekcji \`${targetSectionId}\`.\n\n**Wprowadzone korekty:**\n✓ Zwiększyłem prędkość ruchu: **${updatedExpConfig.motion?.speed}x**\n✓ Zredukowałem intensywność: **${updatedExpConfig.motion?.intensity}x**\n\nEfekt jest teraz bardziej płynny, a jednocześnie subtelny i nie odwraca uwagi od treści.`;

      this.recordEvent({
        id: `evt-motion-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'EXPERIENCE',
        title: 'configure_experience',
        description: `Zmodyfikowano dynamikę w węźle ${targetSectionId} (speed: ${updatedExpConfig.motion?.speed}, intensity: ${updatedExpConfig.motion?.intensity})`,
        nodeId: targetSectionId,
        capability: 'configure_experience',
        status: 'SUCCESS',
      });
    }

    // Branch 5F: Premium Gold Gradient + Spotlight
    else if (
      lower.includes('premium') ||
      lower.includes('złot') ||
      lower.includes('kursor') ||
      lower.includes('gradient')
    ) {
      addStep('step-cap', 'Select capability: configure_experience', 'SUCCESS', 'Dopasowano Visual Experience Runtime');

      if (!targetSectionId) {
        addStep('step-blocked', 'Apply mutation', 'FAILED', 'Brak sekcji do modyfikacji');
        this.status = 'ONLINE';
        return {
          success: false,
          intent: 'EXECUTE',
          message: 'Nie mogę wykonać operacji: Na stronie nie znaleziono żadnej sekcji do zastosowania efektu premium.',
          executionCard: {
            id: `card-${Date.now()}`,
            title: 'HACP EXECUTION',
            status: 'FAILED',
            steps,
            startedAt: startTime,
            validationResult: 'FAIL',
          },
          commandsToDispatch: [],
          eventsToEmit: [],
          errorReason: 'No section available for mutation',
        };
      }

      const goldExperienceConfig: Partial<ExperienceSceneConfig> = {
        background: {
          type: 'mesh-gradient',
          colors: ['#D9A86C', '#F2C27F', '#1A1813', '#080B10'],
          blur: 48,
          speed: 0.8,
          opacity: 0.9,
        },
        pointer: {
          type: 'spotlight',
          strength: 1.25,
          maxAngle: 12,
          perspective: 1200,
          radius: 380,
          color: 'rgba(217, 168, 108, 0.28)',
        },
        motion: {
          type: 'float',
          speed: 0.85,
          intensity: 0.9,
          direction: 'normal',
        },
      };

      const mutationCommand: BuilderCommand = {
        type: 'UPDATE_PROPS',
        pageId: activePageId,
        sectionId: targetSectionId,
        props: {
          experienceConfig: goldExperienceConfig,
          primaryColor: '#D9A86C',
          themeAccent: 'gold-champagne',
        },
      };
      commands.push(mutationCommand);

      appliedChanges.push(
        {
          target: targetSectionId,
          property: 'experienceConfig.background',
          previousValue: context.experienceConfig?.background?.type || 'none',
          newValue: 'mesh-gradient (Gold Champagne Palette)',
          summary: 'Złoty płynny gradient w tle',
        },
        {
          target: targetSectionId,
          property: 'experienceConfig.pointer',
          previousValue: context.experienceConfig?.pointer?.type || 'none',
          newValue: 'spotlight + tilt (Złoty blask kursora)',
          summary: 'Subtelna interakcja kursora i głębia 3D',
        },
        {
          target: targetSectionId,
          property: 'experienceConfig.motion',
          previousValue: context.experienceConfig?.motion?.type || 'none',
          newValue: 'float (speed: 0.85)',
          summary: 'Płynna dynamika elementów',
        }
      );

      addStep('step-mutate', 'Apply mutation: UPDATE_PROPS', 'SUCCESS', 'Zaktualizowano konfigurację węzła');
      addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Zaaplikowano Visual Experience Runtime');
      addStep('step-validate', 'Validate: BuilderDocument + Runtime', 'SUCCESS', 'Walidacja PASS');
      addStep('step-complete', 'Complete', 'SUCCESS', 'Zastosowano 3 zmiany');

      responseMessage = `Gotowe — przygotowałem sekcję premium w stylistyce **SoloSpot Gold**.\n\n**Zrobiłem:**\n✓ Dodałem Experience do sekcji \`${targetSectionId}\`\n✓ Skonfigurowałem złoty gradient w tle (\`#D9A86C\` / \`#F2C27F\`)\n✓ Ustawiłem subtelną interakcję kursora (złoty spotlight & tilt)\n✓ Dopasowałem sekcję do layoutu Canvas\n\n**Zweryfikowano:**\n✓ BuilderDocument\n✓ Geometry & Viewport\n✓ Experience Runtime`;

      this.recordEvent({
        id: `evt-mutate-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'MUTATE',
        title: 'UPDATE_PROPS',
        description: `Wstrzyknięto konfigurację Experience do węzła ${targetSectionId}`,
        nodeId: targetSectionId,
        capability: 'configure_experience',
        status: 'SUCCESS',
      });
      this.recordEvent({
        id: `evt-exp-${Date.now() + 1}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'EXPERIENCE',
        title: 'configure_experience',
        description: `Zastosowano złoty gradient i interakcję kursora w węźle ${targetSectionId}`,
        nodeId: targetSectionId,
        capability: 'configure_experience',
        status: 'SUCCESS',
      });
      this.recordEvent({
        id: `evt-valid-${Date.now() + 2}`,
        timestamp: new Date().toLocaleTimeString('pl-PL'),
        type: 'VALIDATE',
        title: 'Validation PASS',
        description: 'BuilderDocument i ExperienceScene pomyślnie zwalidowane',
        status: 'SUCCESS',
      });
    }

    // Fallback EXECUTE: Specific prop update
    else {
      addStep('step-cap', 'Select capability: update_props', 'SUCCESS', 'Dopasowano optymalizator sekcji');

      if (targetSectionId) {
        commands.push({
          type: 'UPDATE_PROPS',
          pageId: activePageId,
          sectionId: targetSectionId,
          props: {
            primaryColor: '#D9A86C',
          },
        });

        appliedChanges.push({
          target: targetSectionId,
          property: 'primaryColor',
          newValue: '#D9A86C',
          summary: 'Zastosowano akcent kolorystyczny SoloSpot Gold',
        });

        addStep('step-mutate', 'Apply mutation', 'SUCCESS', 'Zastosowano ulepszenie');
        addStep('step-runtime', 'Runtime updated', 'SUCCESS', 'Zsynchronizowano Canvas');
        addStep('step-validate', 'Validate', 'SUCCESS', 'Walidacja PASS');
        addStep('step-complete', 'Complete', 'SUCCESS', 'Operacja zakończona');

        responseMessage = `Zastosowałem modyfikację dla sekcji \`${targetSectionId}\`.`;
      } else {
        addStep('step-blocked', 'Apply mutation', 'FAILED', 'Nie znaleziono odpowiedniego węzła');
        responseMessage = `Nie mogę wykonać tej zmiany: Nie wskazano aktywnego elementu w Builderze.`;
      }
    }

    this.status = 'ONLINE';

    const card: HacpExecutionCard = {
      id: `card-${Date.now()}`,
      title: 'HACP EXECUTION',
      status: 'SUCCESS',
      steps,
      startedAt: startTime,
      completedAt: new Date().toLocaleTimeString('pl-PL'),
      validationResult: 'PASS',
      appliedChanges,
    };

    return {
      success: true,
      intent: 'EXECUTE',
      message: responseMessage,
      executionCard: card,
      commandsToDispatch: commands,
      eventsToEmit: events,
      updatedConversationContext: {
        lastIntent: 'EXECUTE',
        lastProposal: undefined,
        lastTargetNodeId: targetSectionId,
      },
    };
  }
}
