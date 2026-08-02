# Release Governance Process — WEB FACTOR Studio 2.0

> **Epic:** C16 — WEB FACTOR Studio 2.0  
> **Dokument:** 97_RELEASE_GOVERNANCE.md  
> **Status:** Governance Standard  
> **Zależności:** 64_RELEASE_READINESS.md, 92_CI_QUALITY_GATES.md  
>  
> **Proces:** Proces Zatwierdzania i Nadzorowania Wydań (Release Governance)

---

## 1. Ramy Zarządzania Wydaniami (Release Governance Framework)

Proces zatwierdzania wydań w WEB FACTOR Studio 2.0 obejmuje 5 ustandaryzowanych etapów kontrolnych:

```
Development Build ➔ Internal Review ➔ Release Candidate (RC) ➔ Production Release ➔ Hotfix Process
```

---

## 2. Wymagania i Weryfikacja dla Etapów Wydań

| Etap Wydania | Wymagane Artefakty | Wymagane Quality Gates | Wymagane Zatwierdzenia |
|--------------|--------------------|------------------------|------------------------|
| **1. Development Build** | Przechodzące PR-y, snapshot kodu | Quality Gates 1, 2, 3 (Doc, Arch, Type) | Code Reviewer (Peer Review) |
| **2. Internal Review** | Kod w strefie Staging, wygenerowany podgląd | Quality Gate 4 (Test Validation - 100% PASS) | QA Lead / Agent 2 |
| **3. Release Candidate (RC)** | Zamrożona paczka z numerem wersji SemVer | Quality Gate 5 (Performance Gate - 60 FPS) | Lead Architect |
| **4. Production Release** | Opublikowana wersja z wpisem w changelogu | Quality Gate 6 (Release Gate - Zero P1/P2) | Product Owner & Lead Architect |
| **5. Hotfix Process** | Izolowana gałąź `hotfix/`, testy regresyjne | Szybka ścieżka Quality Gates 2, 3, 4 | Lead Architect (Eskalacja P1) |
