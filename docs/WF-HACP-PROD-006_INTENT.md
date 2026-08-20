# TASK WF-HACP-PROD-006 — TASK INTENT & CHARTER

**TASK ID:** WF-HACP-PROD-006  
**PROGRAM:** WEB FACTOR AUTONOMOUS PRODUCT DEVELOPMENT  
**SYSTEM:** HACP — UNIVERSAL CONTROL PLANE  
**MODE:** FULL AUTONOMOUS LONG-RUN CONTROLLED PRODUCTION EXECUTION  
**TYPE:** SUSTAINED AUTONOMOUS MULTI-STAGE PRODUCT DEVELOPMENT  
**MATURITY LEVEL:** LEVEL 6 — LONG-RUN AUTONOMY  

---

## 1. MISSION STATEMENT

Test sustained autonomous engineering behavior over a large multi-stage real WEB FACTOR development mission. HACP must independently discover, design, decompose into 4 dependent development stages, implement, test, adversarially verify, security-audit, failure-inject across 3 points, simulate context interruption & recovery, audit, and commit an enterprise platform deployment and multi-stage release accreditation pipeline.

The capability spans **5 architectural layers** and **4 monorepo packages**:
`LAYER 1 (DOMAIN & PERSISTENCE SSOT) → LAYER 2 (INTEGRATION & READINESS ORCHESTRATION) → LAYER 3 (API GATEWAY & TENANT SECURITY RLS) → LAYER 4 (OBSERVABILITY TELEMETRY) → LAYER 5 (OPERATIONAL SURFACE)`

---

## 2. KEY LEVEL 6 CONSTRAINTS & PRINCIPLES

1. **FOUR DEPENDENT DEVELOPMENT STAGES:** Must execute Stage 1 (Domain SSOT) $\rightarrow$ Stage 2 (Readiness Integration Orchestration) $\rightarrow$ Stage 3 (API Gateway Security RLS) $\rightarrow$ Stage 4 (Observability Telemetry Probe), producing machine-verifiable checkpoints after each stage.
2. **IMMUTABLE MISSION CONTRACT:** Created before implementation (`docs/WF-HACP-PROD-006_MISSION_CONTRACT.md`).
3. **CONTEXT RETENTION & INTERRUPTION RECOVERY:** Reconstruct mission intent, workforce routing, open risks, and current stage without human steering after context interruption.
4. **MANDATORY REWORK EVENT & CHECKPOINT REVALIDATION:** Discover real defect during testing, execute rework loop, and revalidate affected stage checkpoints.
5. **CROSS-STAGE REGRESSION & TESTING:** 7 real E2E workflows, 15 adversarial scenarios, 3 failure injection points across different stages.
6. **CONTROLLED TERMINATION:** Terminate execution cleanly with `CONTROLLED STOP`.
