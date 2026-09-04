# SOLOSPOT — PRODUCT & EXECUTION MAP
## Version 1.2 — 2026-09-03

> **North Star:** Make creation ridiculously simple. Make the possibilities enormous. Make the result professional.

---

## 1. PRODUCT MAP

```text
SOLOSPOT
│
├── CUSTOMER EXPERIENCE
│   │
│   └── SOLOSPOT WEB BUILDER  ← PRIMARY PRODUCT
│       │
│       ├── Core Editor
│       │   ├── Document
│       │   ├── Editor State
│       │   ├── Canvas
│       │   ├── Selection
│       │   ├── Inspector
│       │   ├── Mutation Engine
│       │   ├── History
│       │   └── Persistence
│       │
│       ├── Component Ecosystem
│       │   ├── Layout
│       │   ├── Content
│       │   ├── Navigation
│       │   ├── Marketing
│       │   └── Commerce
│       │
│       ├── Design System
│       │   ├── Typography
│       │   ├── Colors
│       │   ├── Spacing
│       │   ├── Effects
│       │   └── Responsive Rules
│       │
│       ├── Asset Ecosystem
│       │   ├── SoloSpot Library
│       │   └── My Assets
│       │       ├── Images
│       │       ├── SVG
│       │       ├── GIF
│       │       ├── MP4
│       │       ├── WebM
│       │       ├── Lottie
│       │       └── Motion Graphics
│       │
│       ├── Delivery
│       │   ├── Preview
│       │   ├── Publish
│       │   ├── Deployment
│       │   └── Live Verification
│       │
│       ├── Website Product
│       │   ├── SEO
│       │   ├── Forms
│       │   ├── CMS
│       │   ├── Domains
│       │   └── Templates
│       │
│       ├── Commerce Builder
│       │   └── Commerce Engine
│       │
│       └── HACP-Assisted Creation
│           ├── Create
│           ├── Modify
│           ├── Generate Media
│           ├── Diagnose
│           └── Controlled Repair
│
├── PLATFORM
│   ├── Platform Core
│   ├── Runtime
│   ├── Tenant
│   ├── Identity
│   ├── Permissions
│   ├── Events
│   ├── Diagnostics
│   ├── Persistence
│   └── Package System
│
└── OPERATOR EXPERIENCE
    │
    └── MISSION CONTROL
        ├── Users
        ├── Tenants
        ├── Stores
        ├── Projects
        ├── Unique IDs
        ├── Deployments
        ├── Errors
        ├── Incidents
        ├── Diagnostics
        ├── Support
        ├── Feature Requests
        └── Controlled HACP / Engineering Pipeline
```

---

## 2. EXECUTION MAP

```text
W0  TRUTH / RECOVERY
 │
 ▼
W1  CORE EDITOR
 │
 ▼
W2  COMPONENTS
 │
 ▼
W3  LAYOUT / COMPOSITION
 │
 ▼
W4  INSPECTOR
 │
 ▼
W5  PROFESSIONAL TEXT
 │
 ▼
W6  RESPONSIVE
 │
 ▼
W7  HISTORY / PERSISTENCE
 │
 ▼
W8  ASSETS / MEDIA
 │
 ▼
W9  PREVIEW / PUBLISH
 │
 ▼
W10 PROFESSIONAL UX
 │
 ▼
W11 WEBSITE PRODUCT
 │
 ▼
W12 COMMERCE BUILDER
 │
 ▼
W13 HACP-ASSISTED BUILDER
 │
 ▼
W14 BUSINESS APPLICATIONS
 │
 ▼
W15 MOBILE BUILDER
```

**Rule:** downstream work cannot be used to hide a broken upstream gate.

---

## 3. CURRENT POSITION

### Active
**W0 — Truth & Recovery**

### Current mission
**NIGHT SHIFT 22 — REAL STUDIO FUNCTIONALITY RECOVERY**

### Current known L5 blockers

- Sidebar tabs clipped.
- Pages/Layers/Assets/Components are not usable.
- Panels/windows do not behave as expected.
- Many buttons/controls do not work.
- Tablet switching throws runtime errors.
- Mobile switching is not functional.
- Inspector can remain at `NO COMPONENT SELECTED`.
- Current storefront iframe is a preview/runtime surface, not a real editor.

### Acceptance principle

A feature is not accepted because:

- TypeScript passes,
- build passes,
- tests pass,
- HTTP 200 is returned,
- an agent reports PASS.

It is accepted when the real human workflow works.

---

## 4. BUILDER ACCEPTANCE LADDER

```text
GATE A
OPEN → SELECT → EDIT → SEE CHANGE → SAVE → RELOAD
                     │
                     ▼
GATE B
ADD → MOVE → REORDER → DELETE → DUPLICATE
                     │
                     ▼
GATE C
STYLE → TYPOGRAPHY → RESPONSIVE → MEDIA
                     │
                     ▼
GATE D
PREVIEW → PUBLISH → VERIFY LIVE
                     │
                     ▼
GATE E
HACP UNDERSTANDS CONTEXT → ACTS THROUGH CAPABILITIES → VALIDATES → AUDITS
```

---

## 5. HACP MAP

HACP is a controlled layer above deterministic Builder capabilities.

```text
USER REQUEST
     │
     ▼
CONTEXT
(tenant / project / page / element / breakpoint)
     │
     ▼
INTENT
     │
     ▼
CAPABILITY RESOLUTION
     │
     ▼
PLAN
     │
     ▼
CONTROLLED ACTION
     │
     ▼
VALIDATE
     │
     ▼
PREVIEW / RESULT
     │
     ▼
AUDIT
```

Examples:

```text
"Add a hero here."
"Move this button below the text."
"Make this section darker."
"Generate an image for this column."
"Why is this component broken on mobile?"
```

HACP must not directly mutate arbitrary tenant code.

---

## 6. OPERATOR MAP

```text
CUSTOMER
   │
   ▼
TENANT ID
   │
   ▼
STORE / PROJECT ID
   │
   ▼
DEPLOYMENT ID
   │
   ▼
INCIDENT
   │
   ▼
DIAGNOSTICS
   │
   ▼
PLAN
   │
   ▼
IMPLEMENT
   │
   ▼
TEST
   │
   ▼
DEPLOY
   │
   ▼
VERIFY
```

This creates a traceable chain from a customer problem to a verified fix.

---

## 7. DEFINITION OF PROFESSIONAL BUILDER

The Builder is professionally functional only when a real human can:

1. create/open a project,
2. open Studio,
3. create/select a page,
4. add components,
5. compose sections/layouts,
6. select elements,
7. edit properties,
8. edit text,
9. choose fonts,
10. add/upload media,
11. move/reorder elements,
12. delete/duplicate,
13. undo/redo,
14. switch desktop/tablet/mobile,
15. save,
16. reload,
17. preview,
18. publish,
19. verify the live result.

---

## 8. GOVERNANCE

Every code-changing task:

```text
DISCOVER
→ PLAN
→ IMPLEMENT
→ VERIFY DIFF
→ TYPECHECK
→ TEST
→ BUILD
→ GIT ADD
→ COMMIT
→ PUSH
→ npx vercel deploy --prod --yes
→ WAIT FOR READY
→ VERIFY PRODUCTION DEPLOYMENT/DOMAIN
→ LIVE VERIFICATION
```

If blocked:

```text
BLOCKED
+ exact reason
+ exact evidence
```

Never report COMPLETE when the required lifecycle has not completed.

---

## 9. ONE-SENTENCE PRODUCT DEFINITION

> **SoloSpot is a professional visual Web Builder that lets a non-technical user create an advanced website or store with enormous creative possibilities, while the platform underneath provides the infrastructure, asset ecosystem, commerce capabilities, operator control and, later, HACP-assisted creation.**
