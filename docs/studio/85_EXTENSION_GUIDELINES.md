# Builder Extension Guidelines — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 85_EXTENSION_GUIDELINES.md  
> **Status:** Governance Standard  
> **Zależności:** 08_COMPONENT_SYSTEM.md, 65_ARCHITECTURE_PRINCIPLES.md  
>  
> **Proces:** Standard Tworzenia i Integracji Rozszerzeń Buildera

---

## 1. Cel Poradnika Rozszerzeń

WEB FACTOR Studio 2.0 został zaprojektowany jako platforma modułowa otwarty na rozszerzenia (Open-Closed Principle). Niniejszy dokument definiuje jednolity proces wdrożenia dla 6 głównych typów rozszerzeń.

---

## 2. Jednolite Ścieżki Integracji Rozszerzeń

### 2.1 Nowa Właściwość (New Property)
1. **Zdefiniowanie typu w domenie:** Dodanie pola w odpowiednim pliku `Types.ts`.
2. **Implementacja mapowania:** Stworzenie czystej funkcji `propertyToCSS()`.
3. **Rejestracja:** Rejestracja w `propertyFieldRegistry`.
4. **Komponent UI:** Stworzenie pola w `src/components/builder/inspector/fields/`.

### 2.2 Nowy Komponent (New Component)
1. **Opis Deskryptora:** Dodanie definicji `ComponentDescriptor` ze schematem `PropSchema`.
2. **Rejestracja w Rejestrze:** Rejestracja w `ComponentRegistry.register()`.
3. **Renderer Podglądu:** Stworzenie komponentu renderującego w `src/components/store/`.

### 2.3 Nowy Wpis Rejestru (New Registry Entry)
* Rejestracja deklaratywna z podaniem etykiety, kategorii, ikony z Lucide-React oraz wartości domyślnych `defaultProps`.

### 2.4 Nowe Pole Inspectora (New Inspector Field)
* Komponent pola odbiera właściwości `value`, `onChange` i natychmiastowo wywołuje `dispatch({ type: 'UPDATE_PROPS', ... })`.

### 2.5 Nowa Funkcja Silnika Runtime (New Runtime Feature)
* Integracja z silnikiem podglądu odbywa się via bezpieczna rejestracja uchwytu w mostku IPC/PostMessage.

### 2.6 Nowa Zdolność Systemowa (New Capability)
* Rejestracja modułu w strukturze Plugin API (`16_PLUGIN_API.md`).
