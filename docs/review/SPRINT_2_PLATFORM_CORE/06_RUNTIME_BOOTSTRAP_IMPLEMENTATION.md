---
Status: APPROVED
Author: AI Engineering Team
Reviewer: Marcin
Version: 1.0
Last Review: 2026-07-10
Depends On:
- docs/review/SPRINT_2_PLATFORM_CORE/05_DIAGNOSTICS_REGISTRY_IMPLEMENTATION.md
---

# SPRINT 2: PLATFORM CORE IMPLEMENTATION
## Zadanie 6 — Runtime Bootstrap Implementation
*Dokumentacja techniczna oraz specyfikacja implementacyjna cyklu rozruchu silnika platformy (Runtime Bootstrap Engine) w paczce `packages/platform-core`.*

---

### 1. Maszyna Stanów i Inicjalizacja (Boot sequence)

Proces uruchomienia platformy został w pełni zaimplementowany w klasie `Platform` zlokalizowanej pod adresem `packages/platform-core/src/bootstrap/RuntimeBootstrap.ts`. Cykl życia platformy przebiega przez następujące etapy:

1. **`CREATED`**: Stan inicjalny po utworzeniu obiektu w pamięci.
2. **`INITIALIZING`**: Stan tymczasowy podczas sekwencyjnego ładowania modułów:
   * **Wczytanie konfiguracji** (`ConfigurationManager`).
   * **Inicjalizacja Loggera** (`ConsolePlatformLogger`).
   * **Uruchomienie Szyny Zdarzeń** (`PlatformEventBusImpl`) oraz powiązanie z Loggerem w celu przechwytywania logów.
   * **Uruchomienie Diagnostyki** (`DiagnosticsRegistry`) wraz z rejestracją standardowych testów sprawnościowych.
3. **Ewaluacja Self-Check (Health Aggregator)**:
   * Odpytanie rejestru diagnostycznego o ogólny status zdrowia platformy.
   * Na bazie zebranych danych system podejmuje decyzję o docelowym stanie operacyjnym:
     * Wszystkie checki `READY` $\rightarrow$ przejście do stanu **`READY`**.
     * Wykryta degradacja $\rightarrow$ przejście do stanu **`DEGRADED`**.
     * Awaria komponentu krytycznego $\rightarrow$ rzucenie wyjątku i przejście do stanu **`FAILED`**.

---

### 2. Integracja ze Zdarzeniami Telemetrycznymi (Lifecycle Events)

Każde przejście maszyny stanów generuje zdarzenia publikowane asynchronicznie na szynie zdarzeń w celu pełnej obserwowalności startu platformy:

* **`Bootstrap.Started`**: Emitowane na początku rozruchu z metadanymi o środowisku i wersji.
* **`Bootstrap.ModuleInitialized`**: Emitowane po pomyślnym załadowaniu każdego modułu.
* **`Bootstrap.Ready`**: Emitowane po udanym zakończeniu samodiagnostyki i wejściu w pełną gotowość operacyjną.
* **`Bootstrap.Degraded`**: Emitowane w przypadku startu z niekrytyczną usterką.
* **`Bootstrap.Failed`**: Emitowane po przechwyceniu krytycznego wyjątku startupu.

---

### 3. Zestaw Testów Jednostkowych (`runtime-bootstrap.test.ts`)

Testy weryfikują poprawność cyklu życia w pliku `packages/platform-core/src/bootstrap/runtime-bootstrap.test.ts`:

1. **READY Boot sequence**: Potwierdza poprawne przejście z `CREATED` $\rightarrow$ `INITIALIZING` $\rightarrow$ `READY` przy zdrowych modułach.
2. **Failed Boot (Configuration Error)**: Weryfikuje zachowanie platformy po uszkodzeniu zmiennych środowiskowych i niepowodzeniu walidacji Zod (automatyczne rzucenie wyjątku i przejście do stanu `FAILED`).
3. **Degraded Boot**: Testuje scenariusz, w którym niekrytyczna usługa zarejestrowana przed startem zwraca status `DEGRADED`, co skutkuje poprawnym rozruchem platformy w stanie `DEGRADED`.
4. **Critical Diagnostic Failure**: Potwierdza, że awaria (status `FAILED`) któregokolwiek komponentu w rejestrze przerywa boot i kończy się statusem `FAILED`.
5. **Lifecycle Event Ordering**: Sprawdza, czy wszystkie zdarzenia rozruchu pojawiają się na szynie zdarzeń w poprawnej kolejności logicznej.
