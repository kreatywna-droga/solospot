# Document Deprecation Policy — WEB FACTOR Studio 2.0

> [!IMPORTANT]
> **STATUS: Requires Re-ratification**
> 
> Status dokumentu nie został jeszcze formalnie zatwierdzony przez Architekta.
> Dokument opisuje wykonane prace, jednak jedynym źródłem prawdy o statusie sprintów pozostaje:
> `docs/studio/99_IMPLEMENTATION_CHECKLIST.md`

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 104_DOCUMENT_DEPRECATION_POLICY.md  
> **Status:** Governance Standard  
> **Zależności:** 71_DOCUMENTATION_STYLE_GUIDE.md, 72_DOCUMENT_LIFECYCLE.md  
>  
> **Proces:** Polityka Wycofywania i Zastępowania Dokumentów Architektonicznych

---

## 1. Kryteria Wycofania Dokumentu (Deprecation Criteria)

Dokument uznaje się za przestarzały (Deprecated) w następujących przypadkach:
1. Subsystem został w całości zastąpiony przez nowszą wersję silnika (np. zmiana mechanizmu rejestru z v1 na v2).
2. Decyzja architektoniczna została nadpisana przez nowy rekord ADR.
3. Dokumentacja specyfikacji została skonsolidowana w nowszym zbiorczym pliku.

---

## 2. Standard Oznaczania i Migracji

### 2.1 Oznaczenie Nagłówka
Wycofany dokument otrzymuje nagłówek ze statusem `Status: Deprecated ⚠️` oraz ostrzeżeniem w pierwszej linii treści:

```markdown
# [Tytuł Starego Dokumentu]

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** XX_OLD_DOCUMENT.md  
> **Status:** Deprecated ⚠️ — Zastąpiony przez [YY_NEW_DOCUMENT.md](file:///path/to/YY_NEW_DOCUMENT.md)  

> [!WARNING]  
> **TEN DOKUMENT JEST PRZESTARZAŁY.**  
> Całość nowej specyfikacji znajduje się w dokumencie: [YY_NEW_DOCUMENT.md](file:///path/to/YY_NEW_DOCUMENT.md).
```

### 2.2 Wpływ na ADR i Roadmapę
* Zaktualizowanie statusu w centralnym indeksie `77_ADR_INDEX.md`.
* Zaktualizowanie odnośników w macierzy śledzenia `62_BUILDER_TRACEABILITY_MATRIX.md`.
