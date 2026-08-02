# Architecture Consistency Rules — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 86_ARCHITECTURE_CONSISTENCY_RULES.md  
> **Status:** Governance Standard  
> **Zależności:** 65_ARCHITECTURE_PRINCIPLES.md, 74_MODULE_DEPENDENCY_GUIDE.md  
>  
> **Proces:** Reguły Spójności Architektonicznej i Przykłady Naruszeń

---

## 1. Zasady Spójności i Przykłady Naruszeń

Poniższa tabela przedstawia obowiazujące reguły spójności w 9 kluczowych obszarach architektury wraz z jawnymi przykładami naruszeń (Violations), które są bezwzględnie odrzucane podczas Code Review.

| Obszar Modułu | Obowiązująca Reguła Spójności | Przykład Naruszenia (VIOLATION) ❌ | Prawidłowe Rozwiązanie (CORRECT) ✅ |
|---------------|-------------------------------|------------------------------------|-------------------------------------|
| **1. Nazewnictwo** | Pola właściwości w formacie `camelCase`, pliki CSS w `kebab-case`. | `border_radius: '10px'` w obiekcie domenowym. | `borderRadius: '10px'` w modelu domenowym. |
| **2. Struktura Katalogów** | Pola Inspectora umieszczane są wyłącznie w `inspector/fields/`. | Stworzenie `BorderBox.tsx` bezpośrednio w `src/components/`. | Umieszczenie `BorderField.tsx` w `src/components/builder/inspector/fields/`. |
| **3. Zależności** | Brak bezpośrednich importów DOM Iframe do parent React. | `document.getElementById('iframe').contentWindow.document...` | Komunikacja przez `postMessage` z protokołu 54. |
| **4. Importy** | Używanie skrótów ścieżek `@/lib/...` oraz `@/components/...`. | `import { x } from '../../../../../../lib/supabase'` | `import { x } from '@/lib/supabase'` |
| **5. Modele Domenowe** | Modele są czystymi interfejsami bez funkcji i stanów. | Umieszczenie funkcji `calculateBorder()` wewnątrz klasy modelu. | Czysta funkcja pomocnicza w wyodrębnionym module utils. |
| **6. CSS Mapping** | Funkcje mapujące są czyste i zwracają `Record<string, string>`. | Funkcja `flexToCSS()` modyfikująca globalny arkusz DOM. | Funkcja zwracająca czysty obiekt `{ 'display': 'flex' }`. |
| **7. Silnik Runtime** | Runtime nie wysyła komend modyfikujących dokument. | Skrypt Iframe wywołujący `store.dispatch(UPDATE_PROPS)`. | Wysyłanie zdarzenia `NODE_CLICKED` do rodzica. |
| **8. Rejestr (Registry)** | Rejestracja pól odbywa się deklaratywnie w rejestrze. | Hardkodowanie komponentu formularza w `InspectorPanel.tsx`. | Rejestracja pola w `propertyFieldRegistry.tsx`. |
| **9. Inspector UI** | Komponent pola wysyła czystą komendę `UPDATE_PROPS`. | Komponent pola modyfikujący bezpośrednio `builderDocument`. | Wywołanie `dispatch({ type: 'UPDATE_PROPS', props: { ... } })`. |
