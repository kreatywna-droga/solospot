# G1-62 Mission Contract

- **Primary Subsystem**: `StorefrontA11yThemeCustomizerBridgeEngine.ts`
- **Invariants**:
  - `VectorDocumentSnapshot` & `MultiPageSiteDocument` are SSOT.
  - Headless: Pure TS, ZERO DOM/React imports in domain layer.
  - No Fake Claims: Compiles standard CSS custom properties (`ThemeCssVariablesDTO`).
  - 1 HistoryStack commit per theme modification.
  - Full recovery on theme serialization / restoration.
