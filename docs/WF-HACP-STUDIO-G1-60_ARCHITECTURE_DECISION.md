# G1-60 Architecture Decision Record (ADR)

- **ADR-060**: Form configuration, visitor input validation, submission payload compilation, and handoff boundary creation must be implemented in headless `StorefrontFormSubmissionBridgeEngine.ts`.
- **Clean Handoff Boundary**: Form processing stops cleanly at `FormHandoffBoundaryDTO` mapping `{ name, email, message, subject }` directly to backend endpoint `/api/contact` without introducing fake email delivery claims.
