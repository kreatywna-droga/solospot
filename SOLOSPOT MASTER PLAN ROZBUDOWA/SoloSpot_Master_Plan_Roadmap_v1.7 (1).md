# SOLOSPOT

# MASTER PLAN & ROADMAP --- NEW PRODUCT VISION

## Version 1.6 --- Professional Web Builder + Unified Asset Hub + Multi-Provider Asset Ecosystem + Multi-Tenant SaaS Infrastructure + HACP-Assisted Creation

**Status:** MASTER PLAN --- GOVERNING PRODUCT DIRECTION\
**Update:** 2026-09-04 — Unified Asset Hub architecture expanded and the shared multi-tenant hosting/server/domain/scaling model was added, including unique Store/Project IDs, Mission Control operations and HACP support flow.\
**Primary objective:** Build a world-class visual Web Builder that makes
advanced website/store creation extremely simple for the user.

------------------------------------------------------------------------

# 1. VISION

SoloSpot is to become a high-end SaaS platform where a user can log in,
create a website or store visually, fill it with professional content
and assets, publish it, and later extend it into more advanced business
applications and mobile apps.

The first and overriding product priority is:

> **SOLOSPOT WEB BUILDER --- a professional, modern, extremely capable
> visual builder that is simple enough for a non-technical user and
> powerful enough to create production-quality websites and stores.**

The core product philosophy is:

> **Simple to use. Massive in capability.**

The interface should feel simple while the platform underneath provides
a large ecosystem of components, sections, assets, media, responsive
controls, commerce capabilities and eventually HACP assistance.

------------------------------------------------------------------------

# 2. PRODUCT HIERARCHY — WHAT WE ARE BUILDING FIRST

The product is now governed by a strict priority hierarchy:

``` text
LEVEL 1 — SOLOSPOT WEB BUILDER
    ↓
LEVEL 2 — COMPONENT + ASSET ECOSYSTEM
    ↓
LEVEL 3 — PROFESSIONAL DESIGN / TEXT / RESPONSIVE SYSTEM
    ↓
LEVEL 4 — WEBSITE + COMMERCE PRODUCT
    ↓
LEVEL 5 — HACP-ASSISTED CREATION
    ↓
LEVEL 6 — BUSINESS APPLICATION BUILDER
    ↓
LEVEL 7 — MOBILE APP BUILDER
```

The first objective is NOT to expose every platform capability.

The first objective is to make the Builder genuinely excellent.

A feature belongs in the immediate execution path only when it directly
improves the user's ability to create, edit, save, preview or publish a
professional result.

**Critical rule:** architectural completeness does not equal product
completeness. A green build, passing tests, or HTTP 200 is insufficient
when the human workflow is broken.

---

# 2. NORTH STAR

A first-time user with no programming knowledge should be able to:

``` text
CREATE PROJECT
→ OPEN STUDIO
→ CHOOSE / BUILD PAGE
→ ADD COMPONENTS
→ ADD THEIR OWN MEDIA
→ EDIT TEXT
→ STYLE
→ DESIGN RESPONSIVELY
→ SAVE
→ PREVIEW
→ PUBLISH
```

without touching code.

The quality target is the professional expectation established by
leading visual builders such as Wix, Base44, Framer and Shopify Theme
Editor.

These are UX/quality benchmarks, not implementation templates.

------------------------------------------------------------------------

# 3. PRODUCT PILLARS

## PILLAR 1 --- PROFESSIONAL BUILDER

A real visual authoring environment:

-   Canvas
-   Components
-   Sections
-   Layers
-   Inspector
-   Pages
-   responsive editing
-   history
-   persistence
-   preview
-   publish

## PILLAR 2 --- MASSIVE COMPONENT ECOSYSTEM

The builder must eventually provide a very large, curated library of:

-   components,
-   sections,
-   page templates,
-   layouts,
-   navigation,
-   marketing blocks,
-   commerce blocks,
-   forms,
-   galleries,
-   media blocks,
-   reusable sections.

The library must be powerful without becoming confusing.

## PILLAR 3 --- UNIFIED ASSET ECOSYSTEM / ASSET HUB

SoloSpot must not reduce asset management to a simple file-upload panel.
The target is a professional **Asset Hub** embedded directly inside the
Builder.

The user experiences one library, one search, one selection workflow and
one **Use in Website** action, regardless of where the asset originates.

### User-facing Asset Hub

The Builder should expose a unified asset experience with categories such
as:

-   All,
-   Photos,
-   Vectors,
-   SVG,
-   PNG,
-   Illustrations,
-   Icons,
-   Videos,
-   Motion Graphics,
-   Templates,
-   3D / other future categories.

Core workflow:

``` text
SELECT ELEMENT / CONTAINER
        ↓
OPEN ASSET HUB
        ↓
SEARCH "luxury car"
        ↓
CHOOSE TYPE: PHOTOS / VECTORS / SVG / VIDEO / ...
        ↓
BROWSE RESULTS
        ↓
PREVIEW
        ↓
USE THIS ASSET
        ↓
ASSET IS INSERTED INTO CURRENT CONTEXT
```

The user must not need to leave SoloSpot, manually download an asset, and
then upload it again just to use it in the Builder.

### Asset Hub sources

The unified Asset Hub may aggregate multiple controlled sources:

``` text
                    SOLOSPOT ASSET HUB
                           │
                 UNIFIED ASSET SEARCH
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  SoloSpot Library   External Providers    My Assets
        │                  │                  │
        │          official API/licence      │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     AI GENERATOR
                           │
                           ▼
                    UNIFIED ASSET API
                           │
                           ▼
                     SOLOSPOT BUILDER
```

Potential external providers are integrations, not copied libraries. A
provider is allowed only where the technical API, usage rights and licence
terms support the intended SoloSpot workflow.

### Provider abstraction

The platform should use a provider-neutral contract so that adding or
removing a provider does not require rewriting the Builder:

``` text
AssetProvider
├── search()
├── getAsset()
├── getPreview()
├── getLicense()
├── availability / entitlement
└── usage constraints
```

The Builder consumes a normalized asset representation rather than
provider-specific response shapes.

### Source visibility and licensing

The main Builder UX should feel like one SoloSpot library. The provider
name does not need to dominate the search interface.

However, source and licensing information must remain accessible in asset
details whenever applicable:

``` text
Asset Details
├── type
├── dimensions / format
├── source/provider
├── licence / usage rights
├── attribution requirement
├── entitlement / plan requirement
└── usage restrictions
```

SoloSpot must never hide material licensing requirements or represent an
externally sourced asset as a SoloSpot-owned asset when it is not.

### My Assets

User-owned assets remain first-class:

-   photos,
-   video,
-   GIF,
-   WebM,
-   MP4,
-   SVG,
-   Lottie/animation assets,
-   other supported media.

### AI Generator

AI generation becomes another Asset Hub source rather than a separate
product experience:

``` text
ASSET HUB
→ SEARCH EXISTING ASSET
OR
→ GENERATE WITH AI
→ REVIEW
→ USE IN CURRENT ELEMENT
```

Generated assets should enter the same normalized asset lifecycle,
metadata, storage, preview and project-insertion flow as other supported
assets.

**Strategic goal:** users can create original websites rather than being
limited to a small set of repeated platform assets.

## PILLAR 4 --- PROFESSIONAL TEXT EDITOR

Text editing is a first-class Studio capability.

Users must be able to edit text visually and choose from a broad font
system.

Target capabilities:

-   many font families,
-   font size,
-   weight,
-   style,
-   line height,
-   letter spacing,
-   alignment,
-   text color,
-   responsive typography,
-   heading/body styles,
-   reusable text styles,
-   inline text editing,
-   link insertion,
-   lists where appropriate,
-   text formatting controls,
-   style inheritance.

The exact font catalogue should be chosen later based on licensing,
performance and product requirements.

## PILLAR 5 --- HACP-ASSISTED CREATION

Long-term HACP integration is a strategic capability.

HACP should eventually be able to operate inside the SoloSpot
environment as a controlled engineering/creation workforce.

Examples:

``` text
USER:
"Add a hero section with a large image."

HACP:
→ identifies current page/container
→ selects compatible component
→ inserts it
→ configures it
→ validates it
→ presents result
```

Another example:

``` text
USER:
"Generate an image for this column showing a modern black sports car."

HACP / AI MEDIA PIPELINE:
→ identifies target column/container
→ generates or obtains image
→ validates format/dimensions
→ inserts asset
→ configures responsive behavior
→ presents result
```

HACP must not become a source of uncontrolled mutations.

All HACP actions must use controlled platform capabilities, tenant
boundaries, auditability and verification.

------------------------------------------------------------------------

# 4. EXPERIENCE PRINCIPLE

The user should experience:

``` text
I WANT SOMETHING
      ↓
I CAN FIND IT
      ↓
I CAN DRAG / CLICK / TYPE
      ↓
I SEE THE RESULT
      ↓
I CAN CHANGE IT
      ↓
I CAN SAVE IT
      ↓
I CAN PUBLISH IT
```

The platform may be extremely complex internally.

The user experience must remain simple.

------------------------------------------------------------------------

# 5. TARGET STUDIO INFORMATION ARCHITECTURE

Conceptually:

``` text
┌─────────────────────────────────────────────────────────────┐
│ Pages | Design | Preview | Responsive | Undo | Redo | Save │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│ COMPONENTS   │                              │  INSPECTOR    │
│              │           CANVAS             │               │
│ SECTIONS     │                              │  Properties   │
│              │                              │  Typography   │
│ ASSETS       │                              │  Layout       │
│              │                              │  Effects      │
│ LAYERS       │                              │  Responsive   │
│              │                              │               │
└──────────────┴──────────────────────────────┴───────────────┘
```

This is a conceptual target, not a requirement to copy this exact
layout.

------------------------------------------------------------------------

# 6. CORE BUILDER MODEL

The target document flow:

``` text
PAGE DOCUMENT
      ↓
EDITOR STATE
      ↓
CANVAS
      ↓
SELECTION
      ↓
INSPECTOR
      ↓
MUTATION ENGINE
      ↓
HISTORY
      ↓
PERSISTENCE
      ↓
PREVIEW
      ↓
RUNTIME
      ↓
PUBLISH
```

The editor and preview must share the same authoritative document model.

A production storefront iframe must not substitute for a real editor.

------------------------------------------------------------------------

# 7. COMPONENT CONTRACT

Every component should eventually have:

``` text
COMPONENT
├── identity
├── metadata
├── schema
├── default props
├── renderer
├── editor controls
├── responsive behavior
├── accessibility contract
├── persistence
└── runtime behavior
```

This allows the component library to scale without losing consistency.

------------------------------------------------------------------------

# 8. COMPONENT LIBRARY ROADMAP

Initial families:

## Layout

Section, Container, Stack, Columns, Grid, Spacer.

## Content

Heading, Text, Image, Video, Button, Icon, Divider.

## Navigation

Navbar, Menu, Breadcrumbs, Footer.

## Marketing

Hero, Features, Testimonials, FAQ, CTA, Logo Cloud.

## Commerce

Product, Product Card, Product Grid, Product Gallery, Category, Price,
Add to Cart, Cart, Checkout CTA.

Future families can expand according to customer demand.

------------------------------------------------------------------------

# 9. ASSET ECOSYSTEM ROADMAP

The Asset Ecosystem roadmap is now governed by the **Unified Asset Hub**
model.

## Phase A --- My Assets foundation

- upload,
- storage,
- tenant isolation,
- folders/collections,
- search,
- preview,
- selection,
- replacement,
- deletion,
- metadata,
- safe validation,
- direct Canvas insertion.

## Phase B --- Motion/media

Support appropriate:

- GIF,
- MP4,
- WebM,
- SVG,
- Lottie,
- animated graphics,
- motion graphics.

Use safe validation, size limits, optimization and delivery rules.

## Phase C --- SoloSpot Asset Library

Introduce a curated platform library containing:

- photos,
- illustrations,
- icons,
- backgrounds,
- motion graphics,
- video,
- templates,
- reusable creative resources.

The library should be large and continuously extensible rather than a
small fixed collection.

## Phase D --- Unified Asset Hub UX

Build one in-Builder experience:

``` text
ASSETS
→ SEARCH
→ FILTER BY TYPE
→ BROWSE
→ PREVIEW
→ USE IN CURRENT CONTEXT
```

The same UX should work for SoloSpot Library, My Assets and supported
external providers.

## Phase E --- External Asset Providers

Create a provider abstraction and integrate external libraries only through
supported official APIs/partnerships/licences.

Provider requirements:

- normalized search,
- normalized asset metadata,
- preview handling,
- source attribution where required,
- licence visibility,
- entitlement handling,
- rate-limit awareness,
- provider failure isolation,
- no scraping,
- no unauthorized bulk copying/stockpiling.

The first candidate provider must be evaluated by an evidence-based
technical and licensing audit before implementation.

## Phase F --- Contextual discovery

When a user is editing:

``` text
Hero selected
→ relevant images
→ relevant motion
→ relevant backgrounds
→ relevant illustrations
→ relevant templates
```

The library becomes contextual rather than merely a file browser.

## Phase G --- AI Asset Generation

Integrate an image-generation capability into the same Asset Hub:

``` text
SEARCH EXISTING
      OR
GENERATE NEW
      ↓
PREVIEW
      ↓
USE IN PAGE
      ↓
STORE / TRACK METADATA
```

The user should not need to understand which underlying model/provider
created the asset.

## Asset Ecosystem exit gate

The Asset Ecosystem is not complete when an upload endpoint exists.
It is complete only when a real user can:

``` text
OPEN BUILDER
→ SELECT ELEMENT
→ OPEN ASSET HUB
→ SEARCH
→ FILTER
→ PREVIEW
→ SELECT EXTERNAL / SOLOSPOT / MY ASSET / AI ASSET
→ INSERT
→ SAVE
→ RELOAD
→ PREVIEW
→ PUBLISH
```

and licensing/tenant boundaries remain correct.

------------------------------------------------------------------------

# 10. PROFESSIONAL TEXT SYSTEM

The text system becomes a major Studio subsystem.

Target:

``` text
TEXT
├── Content
├── Font family
├── Size
├── Weight
├── Style
├── Line height
├── Letter spacing
├── Alignment
├── Color
├── Links
├── Lists
├── Responsive values
└── Reusable styles
```

Long-term:

``` text
Design System
 ↓
Typography Tokens
 ↓
Heading Styles
 ↓
Body Styles
 ↓
Caption Styles
 ↓
Component Typography
```

This allows professional consistency across entire websites.

------------------------------------------------------------------------

# 11. HACP IN SOLOSPOT

HACP is a future controlled intelligence/engineering layer, not a
replacement for deterministic Studio functionality.

## HACP can eventually assist with:

### Creation

``` text
"Add a pricing section."
"Add a contact form."
"Create a gallery."
```

### Modification

``` text
"Make this section darker."
"Move this button below the text."
"Make the mobile layout two columns."
```

### Media

``` text
"Generate a hero image."
"Create an image for this card."
"Replace this image with a modern abstract background."
```

### Diagnosis

``` text
"Why is this component broken on mobile?"
"Why is the checkout failing?"
```

### Controlled repair

``` text
Detect
→ Diagnose
→ Plan
→ Change
→ Test
→ Verify
→ Apply
```

Every mutation must be traceable.

------------------------------------------------------------------------

# 12. HACP ACTION MODEL

HACP should not directly modify arbitrary tenant code.

Target:

``` text
USER REQUEST
      ↓
HACP
      ↓
INTENT
      ↓
CAPABILITY RESOLUTION
      ↓
TENANT / DOCUMENT CONTEXT
      ↓
CONTROLLED ACTION
      ↓
VALIDATION
      ↓
PREVIEW / RESULT
      ↓
AUDIT
```

For production-impacting actions:

``` text
PLAN
→ VALIDATE
→ APPLY
→ TEST
→ VERIFY
```

This preserves safety and tenant isolation.

------------------------------------------------------------------------

# 13. USER ASSET + HACP COMBINATION

A major future experience:

User selects a container.

Clicks:

**AI / HACP**

and says:

> "Dodaj tutaj zdjęcie nowoczesnego czarnego samochodu sportowego,
> dopasowane do szerokości tej kolumny."

The system should understand:

``` text
Current tenant
Current project
Current page
Current container
Current layout
Current responsive context
```

Then:

``` text
GENERATE
→ VALIDATE
→ INSERT
→ FIT
→ OPTIMIZE
→ PREVIEW
```

This is the target experience.

------------------------------------------------------------------------

# 14. WEBSITE BUILDER ROADMAP — GOVERNING EXECUTION ORDER

The Builder roadmap is sequential at the product-capability level.
Individual implementation tasks may be reordered only when evidence
shows that a dependency or blocker requires it.

## W0 — TRUTH & RECOVERY
**Current active gate**

Recover the real Studio architecture and establish what actually works.

Audit:

- current BuilderApp / BuilderShell / Canvas architecture,
- PageBuilderInteractionEngine,
- document model,
- editor state,
- selection,
- inspector,
- component registry/library,
- Pages,
- Layers,
- Assets,
- persistence,
- responsive state,
- preview,
- publish,
- G1-55–G1-60 provenance,
- current production behavior.

Known L5 failures already observed:

- sidebar tabs are clipped,
- Pages/Layers/Assets/Components content is not usable,
- panels/windows do not behave as expected,
- many controls do not work,
- tablet/mobile switching produces runtime errors,
- Inspector can remain at `NO COMPONENT SELECTED`,
- current preview iframe is not a substitute for an editable Canvas.

**Exit:** a truthful failure map + authoritative editor architecture +
verified recovery priorities.

### Current mission
**NIGHT SHIFT 22 — REAL STUDIO FUNCTIONALITY RECOVERY**

---

## W0A — NIGHT SHIFT 22 EVIDENCE STATUS

Night Shift 22 reports implementation of the first major Studio recovery:

- left sidebar layout widened and tab state synchronized,
- EDIT vs PREVIEW Canvas separation introduced,
- component descriptors seeded for 12 section components,
- component library populated with 12 blocks,
- section config normalization/fallbacks added,
- Publish / Preview / History / AI controls connected,
- viewport presets connected to `SET_VIEWPORT`,
- Builder Loop wiring restored,
- commit `665c97b`,
- Vercel production deployment `dpl_CUcnZ8be5yLL6wfp3Gk4AdMw5mxQ` reported READY,
- Studio production URL returned HTTP 200,
- Preview frame returned HTTP 200,
- automated builder/inspector suite reported 33 test files / 616 tests PASS,
- dedicated Builder Loop test reported 2/2 PASS,
- TypeScript and production build reported PASS.

**Important evidence correction:** this does NOT close W0 or prove a
professional Builder by itself.

The supplied report explicitly establishes automated/build/HTTP evidence,
but it does not provide independent L5 browser evidence proving that a real
human can successfully complete the full Builder workflow.

Therefore:

```text
IMPLEMENTATION       = REPORTED COMPLETE
AUTOMATED VERIFICATION = REPORTED PASS
PRODUCTION DEPLOY      = REPORTED READY
L5 HUMAN ACCEPTANCE    = NOT YET PROVEN
W0 EXIT GATE           = OPEN
W1 START               = BLOCKED UNTIL L5 / EVIDENCE GATE
```

The following must be verified before treating the recovery as product
complete:

```text
OPEN STUDIO
→ SWITCH PAGES
→ SWITCH LAYERS
→ SWITCH ASSETS
→ SWITCH COMPONENTS
→ ADD COMPONENT
→ SELECT
→ INSPECT
→ EDIT
→ SEE CHANGE
→ MOVE / REORDER
→ DELETE / DUPLICATE
→ DESKTOP
→ TABLET
→ MOBILE
→ SAVE
→ RELOAD
→ PREVIEW
```

HTTP 200, build success, and test counts are supporting evidence, not a
substitute for this human workflow.

## W1 — CORE EDITOR
Build the real editing loop:

``` text
PAGE DOCUMENT
→ EDITOR STATE
→ CANVAS
→ SELECTION
→ INSPECTOR
→ MUTATION
→ HISTORY
→ PERSISTENCE
```

Minimum proof:

``` text
SELECT
→ INSPECT
→ CHANGE
→ SEE CHANGE
→ SAVE
→ RELOAD
→ CHANGE PERSISTS
```

**Current status:** PARTIALLY PROVEN by L5. Text editing and Inspector
controls are working in the current human test.

**Exit:** the complete loop is proven, including structural composition,
responsive editing, persistence and reload.

---

## W2 — COMPONENT ECOSYSTEM FOUNDATION

Create a scalable component registry and library.

Every component needs a coherent contract:

``` text
identity
metadata
schema
defaults
renderer
editor controls
responsive behavior
accessibility
persistence
runtime behavior
```

Minimum proof:

``` text
OPEN LIBRARY
→ ADD COMPONENT
→ COMPONENT APPEARS
→ SELECT
→ EDIT
```

---

## W3 — LAYOUT & COMPOSITION

Deliver real composition:

- sections,
- containers,
- columns,
- grids,
- stacks,
- nesting,
- spacing,
- alignment,
- ordering,
- movement,
- duplication,
- deletion,
- drag/drop foundation.

**Exit:** user can actually construct a page from an empty/initial state.

---

## W4 — PROFESSIONAL INSPECTOR

The Inspector becomes a real property editor:

- content,
- layout,
- spacing,
- typography,
- colors,
- borders,
- backgrounds,
- effects,
- component-specific settings,
- responsive overrides.

**Exit:** selected component can be professionally configured.

---

## W5 — PROFESSIONAL TEXT SYSTEM

First-class text authoring:

- broad font catalogue,
- inline editing,
- font family,
- size,
- weight,
- style,
- line height,
- letter spacing,
- alignment,
- color,
- links,
- lists,
- responsive typography,
- reusable text styles.

**Exit:** user can make typography look intentionally designed.

---

## W6 — RESPONSIVE ENGINE

Real responsive editing:

``` text
DESKTOP
   ↓
TABLET
   ↓
MOBILE
```

with:

- breakpoint-aware properties,
- inheritance,
- overrides,
- responsive typography,
- responsive layout,
- responsive visibility,
- reliable device switching.

**Exit:** one project can be intentionally designed for all target widths.

---

## W7 — HISTORY + PERSISTENCE

- save,
- autosave where appropriate,
- undo,
- redo,
- revisions,
- reload recovery,
- conflict-safe persistence.

**Exit:** user does not lose work and editor state is recoverable.

---

## W8 — UNIFIED ASSET HUB / ASSET ECOSYSTEM

W8 is now explicitly broader than My Assets or a static SoloSpot media
library.

### Core Asset Hub

``` text
                 ASSET HUB
                     │
       ┌─────────────┼─────────────┐
       │             │             │
 SoloSpot Library  Providers    My Assets
       │             │             │
       └─────────────┼─────────────┘
                     │
                 AI Generator
                     │
                     ▼
                Builder Canvas
```

### Required user workflow

``` text
OPEN ASSET HUB
→ SEARCH
→ FILTER: PHOTOS / VECTORS / SVG / PNG / VIDEO / ...
→ PREVIEW
→ USE THIS ASSET
→ INSERT INTO CURRENT CONTEXT
```

### Required technical capabilities

- normalized `AssetProvider` contract,
- provider-neutral asset model,
- source/licence metadata,
- entitlement handling,
- external-provider search,
- My Assets storage,
- SoloSpot Library,
- AI-generated assets,
- direct Canvas insertion,
- tenant isolation,
- caching where legally/technically permitted,
- provider failure isolation,
- auditability.

### Required UX rule

The user sees **one SoloSpot Asset Hub**, not a collection of disconnected
websites. Provider identity may remain secondary in the main UX, but source
and licensing details must always be accessible where required.

**Exit:** a real user can find or generate an asset and place it into the
current page without leaving SoloSpot, then save/reload/preview/publish it.

---

## W9 — PREVIEW + PUBLISH

``` text
EDIT
→ VALIDATE
→ PREVIEW
→ PUBLISH
→ DEPLOY
→ VERIFY LIVE RESULT
```

Include:

- publish validation,
- deployment state,
- live verification,
- rollback foundation.

**Exit:** what the user sees in Builder can become a verified live site.

---

## W10 — PROFESSIONAL UX

Polish the professional authoring experience:

- drag/drop quality,
- snapping,
- alignment guides,
- keyboard shortcuts,
- contextual menus,
- useful empty/loading/error states,
- performance,
- discoverability,
- coherent interaction feedback.

**Exit:** the Builder feels fast, clear and professional rather than merely functional.

---

## W11 — WEBSITE PRODUCT

Expand the Builder into a complete website product:

- navigation,
- SEO,
- forms,
- content/CMS,
- analytics,
- domains,
- redirects,
- reusable sections,
- templates.

---

## W12 — COMMERCE BUILDER

Expose the existing Commerce Engine through the Builder:

- products,
- categories,
- variants,
- inventory,
- cart,
- checkout,
- payments,
- orders,
- customers,
- shipping,
- taxes,
- discounts,
- fulfillment,
- notifications.

---

## W13 — HACP-ASSISTED BUILDER

HACP becomes a controlled creation and support layer:

``` text
USER REQUEST
→ CONTEXT
→ INTENT
→ CAPABILITY
→ PLAN
→ CONTROLLED ACTION
→ VALIDATE
→ PREVIEW
→ AUDIT
```

Examples:

- add a hero,
- modify a section,
- move an element,
- diagnose a broken component,
- generate media for a selected container.

HACP must operate through approved Studio capabilities and must not
directly mutate arbitrary tenant code.

---

## W14 — BUSINESS APPLICATION BUILDER

Extend the same authoring model to:

- booking,
- memberships,
- customer portals,
- dashboards,
- subscriptions,
- workflows.

---

## W15 — MOBILE APP BUILDER

Long-term:

``` text
SHARED PROJECT
→ SHARED DATA
→ SHARED CAPABILITIES
→ WEB + MOBILE
```

This remains explicitly downstream of the professional Web Builder.

---

# 14A. BUILDER GATES

Progress is gated by user capability, not by implementation volume.

### GATE A — EDITOR REALITY
A human can:

``` text
OPEN
→ SELECT
→ EDIT
→ SEE CHANGE
→ SAVE
→ RELOAD
```

### GATE B — CREATION
A human can:

``` text
ADD
→ MOVE
→ REORDER
→ DELETE
→ DUPLICATE
```

### GATE C — PROFESSIONAL DESIGN
A human can:

``` text
STYLE
→ TYPOGRAPHY
→ RESPONSIVE
→ MEDIA
```

### GATE D — DELIVERY
A human can:

``` text
PREVIEW
→ PUBLISH
→ VERIFY LIVE
```

### GATE E — INTELLIGENT ASSISTANCE
HACP can perform supported actions through controlled capabilities.

**No downstream phase is considered product-complete while an earlier
gate remains materially broken.**

---

# 15. MISSION CONTROL ROADMAP

Mission Control remains a separate operator platform.

## M1 --- Foundation

-   users,
-   tenants,
-   stores,
-   projects,
-   deployments,
-   IDs.

## M2 --- Monitoring

-   platform health,
-   runtime,
-   deployments,
-   errors,
-   events.

## M3 --- Customer Support

-   incidents,
-   feature requests,
-   customer history,
-   store context.

## M4 --- Diagnostics

``` text
Incident
 ↓
Store ID
 ↓
Deployment
 ↓
Runtime
 ↓
Logs
 ↓
Root Cause
```

## M5 --- Controlled Fix Pipeline

``` text
Issue
 ↓
Diagnosis
 ↓
Plan
 ↓
Implementation
 ↓
Test
 ↓
Deploy
 ↓
Verify
```

## M6 --- HACP Operator Integration

HACP becomes an internal controlled workforce capable of assisting with:

-   diagnosis,
-   code changes,
-   Builder capability additions,
-   tenant-specific fixes where safely supported,
-   automated verification,
-   deployment.

------------------------------------------------------------------------

# 16. CUSTOMER SUPPORT MODEL

Every customer project should be traceable.

Example:

``` text
Customer
 ↓
Tenant ID
 ↓
Store ID
 ↓
Project
 ↓
Deployment ID
 ↓
Incident ID
```

This allows the operator to identify the affected environment
immediately.

------------------------------------------------------------------------

# 17. PLATFORM ARCHITECTURE

Target:

``` text
BUSINESS SOLUTIONS
        ↓
DOMAIN ENGINES
        ↓
PLATFORM CORE
        ↓
INFRASTRUCTURE
```

Domain engines may include:

-   Website Engine,
-   Commerce Engine,
-   Content Engine,
-   Mobile Engine,
-   future business engines.

Shared infrastructure includes:

-   identity,
-   tenant,
-   runtime,
-   permissions,
-   events,
-   diagnostics,
-   packages,
-   persistence.

------------------------------------------------------------------------

# 17A. MULTI-TENANT HOSTING / SERVER / DOMAIN / SCALING ARCHITECTURE

SoloSpot is a shared **multi-tenant SaaS platform**. A customer does not
receive a separate server or separate application installation. Many users,
stores and projects run on the same platform while their data, assets and
runtime context remain isolated.

``` text
                         INTERNET
                            │
                            ▼
                    VERCEL / EDGE / CDN
                            │
             ┌──────────────┴──────────────┐
             │                             │
      SOLOSPOT APPLICATION          PUBLISHED SITES
             │                             │
             └──────────────┬──────────────┘
                            ▼
                   MULTI-TENANT RUNTIME
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
         Store A         Store B        Store N
             │              │              │
             └──────────────┼──────────────┘
                            ▼
                 SUPABASE AUTH / POSTGRES
                        / STORAGE
                            │
                     MISSION CONTROL
                            │
                           HACP
```

## Stable customer/project identity

Every customer project/store receives a stable unique identifier. The
operational identity chain is:

``` text
USER ID
  ↓
TENANT / STORE / PROJECT ID
  ↓
PAGES / DOCUMENTS / ASSETS / DOMAINS / DEPLOYMENTS
```

The Store/Project ID is the primary reference for Mission Control, support,
diagnostics, deployment tracing and controlled HACP operations.

## Domains

SoloSpot must support both platform-controlled subdomains and customer
custom domains. A domain must resolve deterministically to the correct
Store/Project before tenant data is loaded. The domain lifecycle includes
verification, TLS/HTTPS, active/inactive state and deployment association.

``` text
customer-domain.pl
        ↓
edge / domain resolver
        ↓
Store / Project ID
        ↓
Tenant Resolver
        ↓
published page/document
        ↓
live site
```

## Tenant and data isolation

Multi-tenancy is a security boundary, not only a routing feature. Tenant
isolation must be enforced through authorization, tenant/store identity and
RLS where applicable. Cross-tenant reads and writes must fail closed.

## Storage / CDN / media

Application compute and customer media are separate scaling concerns. Asset
storage must be tenant-scoped and include metadata, ownership, validation,
limits and delivery rules. Video and large media require explicit CDN/cache,
egress and capacity planning because media growth can outpace user growth.

## Scaling model

The initial launch is not expected to require a dedicated server per customer.
The platform is designed to grow through measured capacity expansion:

``` text
50 users → 500 → 5,000 → 50,000+
           shared multi-tenant platform
```

Capacity decisions are based on real usage: active users, published stores,
requests, database load, storage, bandwidth/egress, asset volume, video
usage, deployment activity and error rates.

## First 50 users — launch readiness gate

Before treating public launch as operationally ready, prove a scenario in
which approximately 50 users can coexist on the shared platform with:

- multiple draft projects,
- multiple published sites,
- unique Store/Project IDs,
- isolated tenant data,
- working SoloSpot subdomains,
- safe custom-domain association,
- asset storage and delivery,
- observable deployments and errors,
- Mission Control visibility,
- no per-customer server/application installation.

This is an evidence gate, not a claim that 50 users automatically require a
particular server size or paid infrastructure tier.

## Mission Control operational view

Mission Control should eventually expose:

``` text
Users | Active Stores | Published Stores | Errors
Storage | Traffic | Deployments | Incidents

STORE ID | OWNER | DOMAIN | STATUS | DEPLOYMENT | ERRORS
```

Opening a Store/Project ID should provide the operational context needed to
understand its domain, deployment, pages, assets, runtime health and errors.

## HACP operational chain

``` text
Store / Project ID
      ↓
Incident / User problem
      ↓
Diagnostics
      ↓
Plan
      ↓
Controlled action
      ↓
Test
      ↓
Deploy
      ↓
Verify
      ↓
Audit
```

HACP must never bypass tenant isolation or directly mutate arbitrary tenant
code.

------------------------------------------------------------------------

# 18. PACKAGE SYSTEM

Reusable platform units:

``` text
Theme
Block
Component
Capability
Workflow
Integration
AI Agent
Template
Asset
```

Lifecycle:

``` text
DISCOVER
→ VALIDATE
→ INSTALL
→ CONFIGURE
→ ENABLE
→ RUN
→ UPDATE
→ DEPRECATE
```

This becomes important for scaling the Component and Asset ecosystem.

------------------------------------------------------------------------

# 19. QUALITY STANDARD

SoloSpot Studio must be judged on real user capability.

Not:

-   number of tests,
-   number of files,
-   number of engines,
-   HTTP 200,
-   build success alone.

Primary evidence:

### L5 Browser Workflow

``` text
Create
→ Add
→ Select
→ Edit
→ Move
→ Delete
→ Undo
→ Redo
→ Responsive
→ Save
→ Reload
→ Preview
→ Publish
```

If a critical workflow is broken, the feature is not complete.

------------------------------------------------------------------------

# 20. DEFINITION OF DONE --- PROFESSIONAL BUILDER

The Builder is considered professionally functional only when a real
human can:

1.  create/open a project,
2.  open Studio,
3.  create/select a page,
4.  add components,
5.  use sections and layouts,
6.  select elements,
7.  edit properties,
8.  edit text,
9.  choose fonts,
10. add images,
11. upload own assets,
12. use motion/media assets,
13. move/reorder elements,
14. delete elements,
15. undo/redo,
16. switch Desktop/Tablet/Mobile,
17. save,
18. reload,
19. preview,
20. publish,
21. verify the live result.

------------------------------------------------------------------------

# 21. DEFINITION OF DONE --- HACP ASSISTANCE

Later HACP integration is complete only when HACP can safely perform
supported actions such as:

``` text
USER REQUEST
→ UNDERSTAND CONTEXT
→ SELECT CAPABILITY
→ MODIFY DOCUMENT
→ VALIDATE
→ SHOW RESULT
→ AUDIT
```

For production changes:

``` text
PLAN
→ TEST
→ APPLY
→ DEPLOY
→ VERIFY
```

No uncontrolled direct mutation.

------------------------------------------------------------------------

# 22. GOVERNANCE

For every future code-changing agent task:

``` text
DISCOVER
→ PLAN
→ IMPLEMENT
→ DIFF
→ TYPECHECK
→ TEST
→ BUILD
→ COMMIT
→ PUSH
→ VERCEL PRODUCTION
→ READY
→ LIVE VERIFICATION
```

If push or deployment is blocked:

``` text
BLOCKED
```

with exact evidence.

No fake completion.

------------------------------------------------------------------------

# 23. PRIORITY — UPDATED

### P0 — PRODUCT RECOVERY
Real Studio + real editor loop + production correctness.

### P1 — BUILDER CORE
Components + layout + Inspector + text + responsive + persistence.

### P2 — CREATION ECOSYSTEM
Assets + media + templates + professional UX.

### P3 — DELIVERY
Preview + publish + domains + website capabilities.

### P4 — COMMERCE
Professional commerce authoring on top of the existing Commerce Engine.

### P5 — HACP
Controlled AI/HACP-assisted creation, diagnosis and media generation.

### P6 — EXPANSION
Business applications + mobile.

Mission Control develops alongside the platform where required for
operations, but must not derail the Builder priority.

------------------------------------------------------------------------

# 23A. CROSS-CUTTING INFRASTRUCTURE ROADMAP

Infrastructure progresses in parallel with the product roadmap. It does not
change the approved Builder-first order; it provides the operating foundation
needed to safely support each gate and the public launch.

``` text
I0 — MULTI-TENANT FOUNDATION
     shared runtime + tenant isolation
          ↓
I1 — IDENTITY / STORE / PROJECT RESOLUTION
     stable IDs + tenant context
          ↓
I2 — HOSTING / DOMAIN ROUTING
     shared Vercel/edge + subdomains + custom domains
          ↓
I3 — STORAGE / CDN / MEDIA DELIVERY
     assets + optimization + large-media strategy
          ↓
I4 — OBSERVABILITY / MISSION CONTROL
     users + stores + deployments + errors + incidents + usage
          ↓
I5 — CAPACITY / QUOTAS / USAGE
     measured database + storage + bandwidth + request capacity
          ↓
I6 — PUBLIC LAUNCH READINESS
     first 50-user production scenario
          ↓
I7 — SCALE OPERATIONS
     500 → 5,000 → 50,000+ users
```

### Infrastructure gates

- **I0:** tenant boundaries and shared runtime are real and fail closed.
- **I1:** every project/store has a stable ID and deterministic tenant context.
- **I2:** multiple stores can publish through shared infrastructure; subdomains
  and custom domains resolve correctly.
- **I3:** assets are tenant-scoped and delivered reliably; video/large media
  has an explicit scaling strategy.
- **I4:** Mission Control can identify and inspect operational state by Store/Project ID.
- **I5:** usage and capacity metrics exist before scaling decisions are made.
- **I6:** first-50-user launch scenario is verified in production.
- **I7:** growth is handled by measured infrastructure expansion rather than
  creating a separate server/application per customer.

### Product/infrastructure relationship

``` text
PRODUCT ROADMAP
W0 → W1 → W2 → W3 → W4 → W5 → W6 → W7 → W8 → W9 → W10 → W11 → W12 → W13 → W14 → W15

INFRASTRUCTURE
I0 → I1 → I2 → I3 → I4 → I5 → I6 → I7
          runs in parallel and gates public operation where required
```

A product feature is not allowed to claim production readiness if its required
infrastructure, isolation, storage, domain or observability gate is still
materially broken.

------------------------------------------------------------------------

# 24. IMMEDIATE ROADMAP

## CURRENT STATE

The product vision is approved.

The Builder is the primary product.

The current Studio is **not yet accepted as a professional Web Builder**
because L5 human testing has demonstrated material failures.

Therefore the immediate execution path is:

## NIGHT SHIFT 22 — REAL STUDIO FUNCTIONALITY RECOVERY

**Reported complete at implementation level. L5 acceptance remains open.**

### Immediate next gate
**POST-NS22 L5 HUMAN ACCEPTANCE + FUNCTIONAL MATRIX**

Do not advance the roadmap merely because the agent reports PASS.

Then, only after evidence supports the exit gate:


``` text
S0 TRUTH
 ↓
S1 CORE EDITOR
 ↓
S2 COMPONENTS
 ↓
S3 LAYOUT
 ↓
S4 INSPECTOR
 ↓
S5 TEXT
 ↓
S6 RESPONSIVE
 ↓
S7 PERSISTENCE
 ↓
S8 ASSETS
 ↓
S9 PREVIEW/PUBLISH
 ↓
S10 UX
 ↓
S11 WEBSITE
 ↓
S12 COMMERCE
 ↓
S13 HACP
 ↓
S14 BUSINESS APPS
 ↓
S15 MOBILE
```

Mission Control evolves alongside the platform foundation but must not
derail the Builder.

------------------------------------------------------------------------

# 25. ULTIMATE PRODUCT

The long-term SoloSpot experience:

``` text
USER
 ↓
LOGIN
 ↓
DASHBOARD
 ↓
CREATE PROJECT
 ↓
SOLOSPOT STUDIO
 ↓
BUILD
 ├── Components
 ├── Sections
 ├── Assets
 ├── Motion
 ├── Text
 ├── Responsive
 ├── Commerce
 └── AI / HACP
 ↓
SAVE
 ↓
PREVIEW
 ↓
PUBLISH
 ↓
LIVE BUSINESS
```

Operator:

``` text
MISSION CONTROL
 ↓
USER
 ↓
TENANT
 ↓
STORE
 ↓
DEPLOYMENT
 ↓
INCIDENT
 ↓
DIAGNOSTICS
 ↓
HACP / ENGINEERING
 ↓
FIX
 ↓
TEST
 ↓
DEPLOY
 ↓
VERIFY
```

------------------------------------------------------------------------

# FINAL PRODUCT PRINCIPLE

SoloSpot should be:

> **The easiest place to build an advanced website or online store
> without coding.**

The simplicity is in the experience.

The power is in the platform.

The component and asset ecosystem makes creation virtually unlimited.

The professional text system makes the result look designed rather than
assembled.

The responsive engine makes it work everywhere.

HACP eventually becomes the intelligent workforce that can help users
create, modify, diagnose and extend what they build.

And Mission Control gives the SaaS operator visibility and controlled
ability to support every customer environment.

## MASTER NORTH STAR

> **Make creation ridiculously simple. Make the possibilities enormous.
> Make the result professional.**


# 26. UPDATE 2026-09-03 — PRODUCT MAP ALIGNMENT

This update establishes the following as the governing interpretation of
the SoloSpot project:

``` text
                         SOLOSPOT
                            │
                 ┌──────────┴──────────┐
                 │                     │
          CUSTOMER PRODUCT       OPERATOR PLATFORM
                 │                     │
        SOLOSPOT WEB BUILDER      MISSION CONTROL
                 │                     │
      ┌──────────┼──────────┐          │
      │          │          │          │
   EDITOR     COMPONENTS  ASSET HUB  CUSTOMER/OPS
      │          │          │          │
      └──────────┼──────────┘          │
                 │                     │
        DESIGN / TEXT / RESPONSIVE     │
                 │                     │
           WEBSITE PRODUCT             │
                 │                     │
          COMMERCE BUILDER             │
                 │                     │
          HACP ASSISTED LAYER ─────────┤
                 │                     │
        BUSINESS APPLICATIONS          │
                 │                     │
           MOBILE BUILDER              │
                 │                     │
                 └────── SHARED PLATFORM ──────┘
```

## Product identity

**SoloSpot is not primarily an admin panel, commerce backend, or AI
wrapper.**

Its primary customer-facing identity is:

> **A professional Web Builder that makes advanced creation ridiculously
> simple.**

## Core user loop

``` text
LOGIN
→ CREATE PROJECT
→ OPEN STUDIO
→ BUILD
→ ADD COMPONENTS
→ OPEN ASSET HUB
→ SEARCH / UPLOAD / GENERATE ASSETS
→ EDIT TEXT
→ STYLE
→ DESIGN RESPONSIVELY
→ SAVE
→ PREVIEW
→ PUBLISH
→ LIVE BUSINESS
```

## Core operator loop

``` text
MISSION CONTROL
→ USER
→ TENANT
→ STORE / PROJECT ID
→ DEPLOYMENT
→ INCIDENT
→ DIAGNOSTICS
→ CONTROLLED FIX
→ TEST
→ DEPLOY
→ VERIFY
```

## Non-negotiable product rules

1. Builder first.
2. Human workflow evidence outranks test-count optics.
3. No fake editor built around a storefront iframe.
4. No parallel editor created without proving the existing architecture
   cannot be recovered or extended.
5. No arbitrary roadmap jumps.
6. HACP comes after deterministic Builder capabilities exist.
7. Every tenant/store/project remains uniquely traceable.
8. Asset creation and upload are first-class Builder capabilities.
9. Typography is a first-class design system.
10. Every code-changing agent task follows the complete lifecycle:
    diff → typecheck/tests/build → commit → push → Vercel production →
    READY → live verification.
11. A blocked push/deploy is reported as **BLOCKED**, never as COMPLETE.


# 27. CHANGELOG — v1.3

**2026-09-03**

Integrated the Night Shift 22 report into the governing roadmap.

The roadmap now explicitly distinguishes:

- implementation completion,
- automated verification,
- production deployment,
- L5 human acceptance,
- product acceptance.

Night Shift 22 is treated as a major recovery milestone, but **not as proof
that SoloSpot is already a professional Web Builder**.

The governing next step is L5 acceptance of the actual human workflow.


# 28. CHANGELOG — v1.4

**2026-09-03**

Human testing after Night Shift 22 confirmed the first meaningful product
breakthrough:

- text/content editing is now possible,
- right-side Inspector/property parameters are visible,
- Studio behavior has moved beyond passive preview.

The roadmap therefore advances from pure recovery toward targeted Builder
Loop validation.

W0 remains open until the full human workflow is proven. No claim of a
professional Builder is made yet.


# 29. CHANGELOG — v1.5

**2026-09-04**

Established the **Unified Asset Hub** as the governing Asset Ecosystem
architecture.

The new direction is:

``` text
                    SOLOSPOT ASSET HUB
                           │
                 UNIFIED ASSET SEARCH
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
  SoloSpot Library   External Providers    My Assets
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                     AI GENERATOR
                           │
                           ▼
                    SOLOSPOT BUILDER
```

The user experience is intentionally provider-agnostic: users search by
query and asset type, preview results and insert assets directly into the
current Builder context without leaving SoloSpot. Provider/source and
licensing information remains accessible in asset details.

External libraries are treated as provider integrations through official
APIs/licences, never as scraping or unauthorized copied repositories.

This update expands the original Asset Ecosystem from **My Assets +
SoloSpot Library** into a scalable creative infrastructure capable of
supporting large external libraries and AI-generated individualized assets.


# CHANGELOG — v1.6

**2026-09-04**

Added the production operating model for SoloSpot as a shared multi-tenant
SaaS platform. The plan now explicitly covers shared Vercel/edge hosting,
Supabase Auth/PostgreSQL/Storage, stable User/Tenant/Store/Project IDs,
subdomain and custom-domain resolution, tenant isolation, storage/CDN/media
strategy, Mission Control operational visibility, and the controlled HACP
incident-to-verification chain.

Added the cross-cutting Infrastructure Roadmap **I0–I7** and the public-launch
readiness gate for the first approximately **50 simultaneous customer users**,
with measured growth targets of **500 → 5,000 → 50,000+ users**.

The existing Builder roadmap order remains unchanged: W0–W15 stays the governing
product-capability sequence. Infrastructure is a parallel operational track,
not a reason to reorder the Builder roadmap.
