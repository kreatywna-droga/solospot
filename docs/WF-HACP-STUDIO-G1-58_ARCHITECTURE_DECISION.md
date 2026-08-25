# G1-58 Architecture Decision Record (ADR)

- **ADR-058**: Client-side storefront cart session state and checkout transition flow must be implemented in headless `StorefrontCartCheckoutDrawerEngine.ts`.
- **Integer Cents Rule**: Monetary values are stored as integer cents to eliminate floating-point rounding bugs.
- **Payment Gateway Handoff**: Order intent creation stops cleanly at `OrderIntentDTO` for backend orchestration via `/api/store/checkout`.
