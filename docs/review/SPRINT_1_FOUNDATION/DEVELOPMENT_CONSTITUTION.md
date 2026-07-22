# DEVELOPMENT CONSTITUTION (ENGINEERING RULES)
## Wersja: 1.2 (Approved)
## Status: APPROVED
## Autor: AI Engineering Team & Chief Architect Marcin

---

> [!IMPORTANT]
> Niniejszy dokument stanowi nienaruszalną konstytucję inżynieryjną platformy **WEB FACTOR**. Każda linijka kodu wprowadzona do repozytorium musi być w 100% zgodna z poniższymi zasadami. Wszelkie odstępstwa będą odrzucane podczas Code Review.

---

## 1. Architektura Jednego Silnika (One Engine Philosophy)
1. **Nadrzędna Zasada Enterprise (The Golden Rule):**
   > **Everything configurable. Nothing forked.**
   > 
   > Nie tworzymy specjalnych gałęzi kodu (forków) ani dedykowanych komponentów dla wybranych klientów. Każda różnica w wyglądzie lub zachowaniu sklepu musi wynikać wyłącznie z dynamicznej konfiguracji, włączonych pakietów, capabilities i motywów.
2. **Zakaz Klonowania Kodu (No-Copy-Paste-Forking):** Kopiowanie komponentów wizualnych lub logiki biznesowej pod "Store A" jest zabronione.
3. **Rozszerzanie zamiast modyfikacji (Extend, Don't Mutate):** Modyfikacje silnika muszą zachowywać wsteczną kompatybilność.

---

## 2. Warstwy Architektoniczne i ich Odpowiedzialność (Layer Responsibility)

Platforma WEB FACTOR opiera się na rygorystycznym podziale na cztery warstwy. Żadna warstwa nie może wykraczać poza swoje kompetencje.

```text
  ┌───────────────────────────────────────────────────────────┐
  │                         UI Layer                          │
  │  (Prezentacja, brak logiki, brak zapytań SQL/Supabase)     │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                     Application Layer                     │
  │  (Use cases, orchestracja procesów, walidacja reguł)     │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                       Domain Layer                        │
  │  (Commerce Engine, Capability Engine, Pricing, Provision)  │
  └─────────────────────────────┬─────────────────────────────┘
                                │
                                ▼
  ┌───────────────────────────────────────────────────────────┐
  │                   Infrastructure Layer                    │
  │  (Supabase DB, Stripe/1Koszyk, Email, Storage CDN)        │
  └───────────────────────────────────────────────────────────┘
```

### 2.1 UI Layer
* **Odpowiedzialność:** Prezentacja danych, obsługa interakcji użytkownika, rendering komponentów (RSC oraz Client Components), przekazywanie zdarzeń do warstwy aplikacji.
* **Zakazy:** Bezwzględny zakaz pisania logiki biznesowej, bezpośrednich zapytań SQL/Supabase, bezpośrednich integracji z bramkami płatniczymi.

### 2.2 Application Layer
* **Odpowiedzialność:** Koordynacja przypadków użycia (use cases), orkiestracja przepływów (np. koszyk -> płatność), walidacja wejściowa (np. schema validation).
* **Zasada:** Łączy domenę z infrastrukturą, ale sama nie zawiera podstawowych reguł biznesowych handlu.

### 2.3 Domain Layer
* **Odpowiedzialność:** Czysta logika biznesowa (Commerce Engine, Capability Engine, Pricing, Provisioning).
* **Zasada:** Logika jest całkowicie czysta i bezstanowa (stateless), pozbawiona wiedzy o routingu czy żądaniach HTTP.

### 2.4 Infrastructure Layer
* **Odpowiedzialność:** Połączenia z bazą danych (Supabase clients), bramkami płatności (Stripe, 1koszyk), systemami powiadomień (Nodemailer) i CDN Storage.

---

## 3. Reguła Zależności (Dependency Rule)

Zależności w projekcie mogą płynąć wyłącznie z góry do dołu:
$$\text{UI Layer} \rightarrow \text{Application Layer} \rightarrow \text{Domain Layer} \rightarrow \text{Infrastructure Layer}$$

* **Zakaz Odwracania Zależności:** Warstwa domenowa lub infrastrukturalna nie może wiedzieć o istnieniu warstwy UI.
* **Brak Zależności Kołowych (Zero Circular Dependencies):** Cykle w importach są kategorycznie zabronione.

---

## 4. Reguła Publicznego API (Public API Rule)

Każdy moduł/pakiet w platformie musi posiadać dokładnie jeden punkt wejścia w postaci pliku `index.ts` pełniącego rolę bramy (Facade/Public API).
* Wszystkie pliki wewnętrzne (np. `packages/commerce/src/db.ts`) pozostają **prywatne** i nie mogą być importowane bezpośrednio przez inne moduły.

---

## 5. Capability & Permission System (Forbidden Rules)
1. **Zakaz sprawdzania planu marketingowego (No Plan Checks):**
   * Kategorycznie zabrania się stosowania konstrukcji typu `if (plan === 'PRO')` w logice aplikacji.
   * W kodzie badamy wyłącznie konkretne uprawnienia i możliwości (Capabilities) za pomocą funkcji `hasCapability()`.
2. **Zakaz sprawdzania branży / klienta (No Store-Specific Hardcoding):**
   * Kategorycznie zabrania się używania warunków typu `if (store.id === 'xyz')` lub `if (store.type === 'fashion')`.
   * Zróżnicowanie realizujemy za pomocą Capability i flag właściwości (Features).

---

## 6. Kiedy wymagany jest dokument ADR (ADR Trigger Table)

Każda fundamentalna zmiana w architekturze wymaga formalnego zgłoszenia i zatwierdzenia Architecture Decision Record (ADR) zgodnie z poniższą tabelą:

| Zmiana | ADR wymagany |
| :--- | :---: |
| Dodanie nowego modułu (Module) | **TAK** |
| Dodanie nowego silnika (Engine) | **TAK** |
| Zmiana schematu bazy danych (Database Schema) | **TAK** |
| Zmiana kontraktu międzywarstwowego | **TAK** |
| Zmiana publicznego API kluczowego modułu | **TAK** |
| Zmiana struktury specyfikacji Package Manifest | **TAK** |

---

## 7. Zasady Czystości Kodu i Współdzielenia (DRY & Shared)
1. **Zasada DRY (Don't Repeat Yourself):** Kod powtarzający się w co najmniej dwóch odrębnych modułach domenowych musi zostać wydzielony do katalogu `src/shared/`.
2. **Kontrakt i Testy:** Każda nowa funkcjonalność w warstwie domenowej musi mieć zdefiniowany kontrakt w `docs/contracts/` oraz pokrycie testami jednostkowymi.
3. **RLS Role-Based Access:** Dostęp do danych jest autoryzowany na poziomie bazy przy użyciu polityk RLS opartych na rolach w `store_members`.
