# SOLOSPOT

# MASTER PLAN & ROADMAP --- NEW PRODUCT VISION

## Version 1.0 --- Professional Builder → Business Platform → Operator Control Plane

**Status:** MASTER PLAN\
**Strategic priority:** Professional Studio / Website & Store Builder\
**Product:** SoloSpot\
**Guiding principle:** Build a real product, prove it in real user
workflows, then expand.

------------------------------------------------------------------------

## 1. Executive Vision

SoloSpot is intended to become a high-end SaaS platform where a customer
can log in, enter their own workspace, and independently create,
configure, publish and continuously develop a complete digital business.

The first and most important product is a **professional visual Website
& Store Builder**.

The long-term platform should allow a customer to create:

1.  a professional website,
2.  an e-commerce store,
3.  advanced business applications,
4.  eventually a mobile application,

without requiring the customer to write code.

At the same time, SoloSpot will have a separate operator environment ---
**Mission Control** --- through which the SaaS owner can monitor users,
tenants, stores, deployments, incidents and requested changes.

The product relationship is:

``` text
CUSTOMER → USER DASHBOARD → SOLOSPOT STUDIO → WEBSITE / STORE / APP → RUNTIME → LIVE BUSINESS
```

Operator side:

``` text
MISSION CONTROL → USERS → TENANTS → STORES → RUNTIME / DEPLOYMENTS
                         ↓
                INCIDENTS / REQUESTS
                         ↓
                     DIAGNOSTICS
                         ↓
               CONTROLLED FIX PIPELINE
                         ↓
                  TEST → DEPLOY → VERIFY
```

The ultimate goal is not merely an editor. It is a **business-building
platform with an operational control plane**.

------------------------------------------------------------------------

# 2. North Star

> A customer should be able to enter SoloSpot with no development
> knowledge, build a production-quality website or store visually,
> publish it, and continue operating it from the same platform.

The operator should be able to see and manage the resulting digital
businesses from a separate administrative control plane.

### Core success test

> Can a first-time user create a professional website or store from an
> empty project, without touching code, and successfully publish it?

If not, SoloSpot Studio is not complete.

------------------------------------------------------------------------

# 3. Product Principles

### 3.1 Product truth over engineering appearance

Routes, engines, abstractions, test counts, TypeScript success, HTTP 200
and build success do not by themselves prove that the product works.

The primary evidence is the real user workflow:

``` text
Create page
→ add component
→ select component
→ edit property
→ see change
→ responsive mode
→ save
→ reload
→ preview
→ publish
```

### 3.2 Reuse before CREATE

Before creating a new subsystem:

1.  prove the capability is absent,
2.  inspect existing implementations,
3.  determine whether reconnect/refactor/extension is sufficient,
4.  create only if necessary.

### 3.3 No fake functionality

A button that does nothing is not a feature.

A mocked test is not production proof.

A hardcoded storefront shown inside a preview is not proof of an editor.

### 3.4 Architecture serves the product

Platform Core, Runtime, Package System and Domain Engines exist to make
the product scalable. They are not the product themselves.

### 3.5 Tenant isolation is fundamental

Every customer environment must be uniquely identifiable and isolated.

Every store/project needs a stable unique identifier.

------------------------------------------------------------------------

# 4. Product Model

``` text
User
 ↓
Organization / Account
 ↓
Tenant
 ↓
Project
 ↓
Site / Store / App
 ↓
Document / Pages
 ↓
Runtime
 ↓
Deployment
 ↓
Live Environment
```

Important identifiers:

``` text
USER_ID
TENANT_ID
PROJECT_ID
STORE_ID
DOCUMENT_ID
VERSION_ID
DEPLOYMENT_ID
INCIDENT_ID
REQUEST_ID
CAPABILITY_ID
```

These identifiers should remain traceable through the platform
lifecycle.

Example:

``` text
Store ID: SS-8FABAB42
Tenant: T-00192
Deployment: D-009821
```

------------------------------------------------------------------------

# 5. SoloSpot Studio --- Primary Product

Studio is the highest priority.

It must become a genuine professional visual builder.

## Required core workflow

``` text
Dashboard
 ↓
Open Studio
 ↓
Select Page
 ↓
Canvas
 ↓
Components
 ↓
Select
 ↓
Inspector
 ↓
Edit
 ↓
Responsive
 ↓
Undo / Redo
 ↓
Save
 ↓
Preview
 ↓
Publish
```

------------------------------------------------------------------------

# 6. Studio Architecture

Target:

``` text
Page Document
      ↓
Editor State
      ↓
Canvas
      ↓
Selection
      ↓
Inspector
      ↓
Mutation Engine
      ↓
History
      ↓
Persistence
      ↓
Preview
      ↓
Runtime
      ↓
Publish
```

The production storefront iframe must not be the primary editing
surface.

### Edit Mode

-   structured document,
-   selectable nodes,
-   editable properties,
-   component insertion,
-   movement,
-   deletion,
-   responsive state,
-   history,
-   persistence.

### Preview Mode

-   real storefront rendering,
-   real runtime,
-   customer-facing behavior.

Preview may reuse the same document/runtime composition but must not
replace the editing model.

------------------------------------------------------------------------

# 7. Canvas

The Canvas must support:

-   selection,
-   hover,
-   selection boundary,
-   nested elements,
-   insertion,
-   movement,
-   deletion,
-   duplication where supported,
-   layout changes,
-   responsive editing,
-   immediate visual updates.

Canvas selection and Layers selection must stay synchronized.

------------------------------------------------------------------------

# 8. Component System

Initial component categories:

### Layout

-   Section
-   Container
-   Stack
-   Columns
-   Grid
-   Spacer

### Content

-   Heading
-   Text
-   Image
-   Video
-   Button
-   Icon
-   Divider

### Navigation

-   Navbar
-   Menu
-   Breadcrumbs
-   Footer

### Marketing

-   Hero
-   Features
-   Testimonials
-   FAQ
-   CTA
-   Logo Cloud

### Commerce

-   Product
-   Product Card
-   Product Grid
-   Product Gallery
-   Category
-   Price
-   Add to Cart
-   Cart
-   Checkout CTA

Every component should have:

``` text
schema
default props
renderer
editor controls
responsive behavior
persistence
runtime behavior
```

------------------------------------------------------------------------

# 9. Inspector

Selecting a component must display its real properties.

Example:

``` text
HERO

CONTENT
Title
Subtitle
Button

LAYOUT
Width
Height
Padding
Margin
Alignment

TYPOGRAPHY
Font
Size
Weight
Line Height
Letter Spacing

COLORS
Background
Text
Button

RESPONSIVE
Desktop
Tablet
Mobile
```

Property changes must update the Canvas immediately.

------------------------------------------------------------------------

# 10. Layers

Layers represent the actual document tree.

``` text
Home
 ├── Navbar
 ├── Hero
 │    └── Container
 │         ├── Heading
 │         ├── Text
 │         └── Button
 ├── Product Grid
 │    ├── Product Card
 │    ├── Product Card
 │    └── Product Card
 └── Footer
```

Selecting a layer selects the corresponding Canvas element and Inspector
state.

------------------------------------------------------------------------

# 11. Pages

Users must be able to:

-   list pages,
-   create pages,
-   rename,
-   set slug,
-   duplicate where appropriate,
-   delete,
-   choose templates,
-   manage navigation relationship,
-   configure page SEO metadata.

------------------------------------------------------------------------

# 12. Assets

Asset Manager should eventually provide:

-   image upload,
-   video upload,
-   asset library,
-   search,
-   preview,
-   selection,
-   replacement,
-   deletion,
-   metadata.

Assets must integrate directly with component properties.

------------------------------------------------------------------------

# 13. Responsive Editing

Real responsive editing:

``` text
Desktop
Tablet
Mobile
```

Minimum verification widths:

``` text
1440px
1024px
768px
390px
```

Switching viewport must change the actual Canvas dimensions/rendering
context, not just the active icon.

No component should throw undefined-property errors when changing
viewport.

------------------------------------------------------------------------

# 14. History

Undo/Redo must operate on real document mutations.

``` text
Change title → Undo → title restored
Add component → Undo → component removed
Delete component → Undo → component restored
```

Redo restores the change.

------------------------------------------------------------------------

# 15. Persistence

Save must persist the structured document.

``` text
Edit
 ↓
Save
 ↓
Database
 ↓
Reload
 ↓
Same document
```

Production workflow must not rely on fake local-only persistence.

------------------------------------------------------------------------

# 16. Preview

Preview must render the current/saved document.

It must not silently substitute hardcoded template data or an unrelated
storefront.

------------------------------------------------------------------------

# 17. Publishing

Publishing:

``` text
DRAFT
 ↓
VALIDATE
 ↓
COMPOSE
 ↓
DEPLOY
 ↓
READY
 ↓
LIVE
```

Every deployment should be traceable by:

-   deployment ID,
-   tenant ID,
-   project/store ID,
-   document/version,
-   timestamp,
-   status,
-   environment.

------------------------------------------------------------------------

# 18. Quality Benchmark

SoloSpot Studio should target the professional UX level expected from
leading visual builders such as:

-   Wix,
-   Base44,
-   Framer,
-   Shopify Theme Editor,
-   comparable modern builders.

Benchmark areas:

-   usability,
-   interaction quality,
-   visual clarity,
-   editing speed,
-   responsiveness,
-   discoverability,
-   reliability.

The goal is not to copy implementation. The goal is to meet or exceed
the professional expectation.

------------------------------------------------------------------------

# 19. Studio Roadmap

## S0 --- Truth & Architecture Recovery

Audit:

-   G1-55 through G1-60 provenance,
-   BuilderApp,
-   Canvas,
-   Interaction Engine,
-   selection,
-   Inspector,
-   Components,
-   persistence,
-   Preview,
-   responsive system,
-   duplicate/parallel systems.

**Exit:** real Builder architecture understood.

## S1 --- Core Editor Recovery

Deliver:

-   Canvas selection,
-   Layers synchronization,
-   Inspector synchronization,
-   property mutation,
-   live Canvas update,
-   real document state.

**Exit:**

``` text
SELECT → INSPECT → EDIT → SEE CHANGE
```

works end-to-end.

## S2 --- Component Library

Deliver:

-   registry,
-   categories,
-   metadata,
-   default props,
-   insertion,
-   rendering,
-   selection,
-   editing.

**Exit:**

``` text
OPEN COMPONENTS → ADD → APPEARS → SELECT → EDIT
```

## S3 --- Layout & Composition

Deliver:

-   sections,
-   containers,
-   columns,
-   grids,
-   spacing,
-   alignment,
-   nesting,
-   ordering,
-   move,
-   duplicate,
-   delete.

**Exit:** user can build a page from scratch.

## S4 --- Professional Inspector

Deliver:

-   content,
-   typography,
-   layout,
-   spacing,
-   colors,
-   borders,
-   backgrounds,
-   responsive values,
-   component-specific properties.

## S5 --- Responsive Engine

Deliver:

-   Desktop,
-   Tablet,
-   Mobile,
-   breakpoint-aware values,
-   inheritance,
-   responsive preview.

## S6 --- Document & History

Deliver:

-   document model,
-   persistence,
-   autosave where appropriate,
-   undo,
-   redo,
-   revision tracking,
-   reload/recovery.

## S7 --- Assets & Media

Deliver:

-   asset manager,
-   upload,
-   selection,
-   replacement,
-   media properties,
-   optimization integration.

## S8 --- Preview & Publish

Deliver:

-   preview,
-   validation,
-   publishing,
-   deployment tracking,
-   live environment,
-   rollback foundation.

## S9 --- Professional UX

Only after the core editor works:

-   keyboard shortcuts,
-   contextual menus,
-   drag/drop,
-   snapping,
-   alignment guides,
-   breadcrumbs,
-   polished empty/loading/error states,
-   autosave feedback,
-   performance.

**Exit:** Studio feels like a commercial builder, not an internal
engineering tool.

## S10 --- Website Product

Expand with:

-   navigation,
-   SEO,
-   forms,
-   content/blog,
-   analytics,
-   domains,
-   redirects,
-   metadata,
-   templates,
-   reusable sections/components.

## S11 --- Commerce Product

Integrate the existing Commerce Engine into a complete store builder:

-   products,
-   categories,
-   variants,
-   inventory,
-   cart,
-   checkout,
-   payments,
-   orders,
-   customers,
-   shipping,
-   taxes,
-   discounts,
-   fulfillment,
-   notifications.

## S12 --- Business Application Builder

Only after website/store foundations are stable.

Potential domains:

-   booking,
-   customer portals,
-   memberships,
-   subscriptions,
-   dashboards,
-   business workflows.

Demand-driven.

## S13 --- Mobile App Builder

Long-term:

``` text
Web Project
 ↓
Shared Data / Capabilities
 ↓
Mobile Application
```

Reuse platform identity, tenant, data, capabilities and package
concepts.

Mobile is not the immediate priority.

------------------------------------------------------------------------

# 20. Mission Control --- Operator Platform

Mission Control is a separate operator-facing application.

Purpose:

> Give the SaaS owner operational visibility and controlled
> intervention.

## Core areas

### Platform

-   health,
-   runtime,
-   deployments,
-   infrastructure,
-   events,
-   failures.

### Customers

-   users,
-   tenants,
-   projects,
-   stores,
-   subscriptions.

### Stores

-   all,
-   live,
-   drafts,
-   failed deployments,
-   suspended.

### Support

-   incidents,
-   customer requests,
-   bugs,
-   feature requests.

### Operations

-   deployments,
-   rollbacks,
-   logs,
-   audit trail,
-   runtime diagnostics.

------------------------------------------------------------------------

# 21. Incident Pipeline

A customer issue becomes a structured case:

``` text
CUSTOMER REPORT
 ↓
CASE
 ↓
STORE / TENANT ID
 ↓
DIAGNOSTICS
 ↓
ROOT CAUSE
 ↓
PROPOSED FIX
 ↓
VALIDATION
 ↓
TEST
 ↓
DEPLOY
 ↓
VERIFY
 ↓
CLOSE CASE
```

No uncontrolled production mutation.

Every operator action must be auditable.

------------------------------------------------------------------------

# 22. Feature Request Pipeline

``` text
REQUEST
 ↓
CLASSIFY
 ↓
CAPABILITY CHECK
 ↓
COMPATIBILITY CHECK
 ↓
PLAN
 ↓
IMPLEMENT
 ↓
TEST
 ↓
DEPLOY
 ↓
VERIFY
 ↓
ENABLE FOR TENANT
```

Where practical, capabilities should be packaged and versioned.

------------------------------------------------------------------------

# 23. Tenant Control

Mission Control should eventually expose:

-   tenant identity,
-   stores,
-   domains,
-   deployments,
-   runtime status,
-   enabled capabilities,
-   incidents,
-   audit trail.

Administrative visibility must not become a backdoor around tenant
isolation.

------------------------------------------------------------------------

# 24. Platform Architecture

Target layers:

``` text
BUSINESS SOLUTIONS
        ↓
DOMAIN ENGINES
        ↓
PLATFORM CORE
        ↓
INFRASTRUCTURE
```

### Platform Core

Shared:

-   identity,
-   tenancy,
-   runtime,
-   configuration,
-   permissions,
-   events,
-   diagnostics,
-   package lifecycle.

### Domain Engines

Potential engines:

-   Website,
-   Commerce,
-   Content,
-   Mobile,
-   future business domains.

### Studio

Customer authoring environment.

### Mission Control

Operator control plane.

------------------------------------------------------------------------

# 25. Package / Capability Model

Reusable package concepts:

``` text
Theme
Block
Capability
Workflow
Integration
AI Agent
Template
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

This is especially important for future feature delivery and
tenant-specific capabilities.

------------------------------------------------------------------------

# 26. AI Strategy

AI should enhance the product, not hide missing functionality.

Later capabilities may include:

-   generate page,
-   generate section,
-   rewrite content,
-   suggest layout,
-   product description generation,
-   SEO assistance,
-   diagnostics,
-   fix proposals.

But:

``` text
REAL BUILDER
 ↓
AI-ASSISTED BUILDER
```

Never the reverse.

------------------------------------------------------------------------

# 27. Security

Required principles:

-   strict tenant isolation,
-   fail closed,
-   server-authoritative state,
-   authorization at sensitive boundaries,
-   audit trail,
-   no client-supplied authority,
-   secure deployment,
-   controlled operator privileges.

------------------------------------------------------------------------

# 28. Observability

Long-term traceability:

``` text
User
 ↓
Tenant
 ↓
Store
 ↓
Document
 ↓
Runtime
 ↓
Deployment
 ↓
Request
 ↓
Incident
```

This allows fast diagnosis and support.

------------------------------------------------------------------------

# 29. Development Governance

Every significant task follows:

``` text
DISCOVER
→ PLAN
→ IMPLEMENT
→ TEST
→ AUDIT
→ COMMIT
→ PUSH
→ VERCEL PRODUCTION
→ READY
→ LIVE VERIFICATION
```

A code change is not complete merely because local tests pass.

------------------------------------------------------------------------

# 30. Mandatory Deployment Lifecycle

For every future agent task introducing code changes:

``` text
CHANGE
 ↓
DIFF VERIFICATION
 ↓
TYPECHECK
 ↓
TEST
 ↓
BUILD
 ↓
GIT ADD
 ↓
GIT COMMIT
 ↓
GIT PUSH
 ↓
VERIFY REMOTE HEAD
 ↓
npx vercel deploy --prod --yes
 ↓
WAIT FOR READY
 ↓
VERIFY PRODUCTION DOMAIN
 ↓
VERIFY LIVE RUNTIME
```

If push or deployment is blocked:

``` text
BLOCKED
```

with the exact error.

No agent may pretend local completion equals production completion.

Do not require Vercel Pro unless a future, explicit product decision
changes this rule.

------------------------------------------------------------------------

# 31. Evidence Levels

### L1 --- Source

Code/config inspection.

### L2 --- Automated

Tests, typecheck, build.

### L3 --- Infrastructure

Vercel, Supabase, deployment/configuration.

### L4 --- Live Runtime

Real production HTTP/runtime behavior.

### L5 --- Browser

Real interactive browser behavior.

Critical Studio claims should ultimately reach L5.

------------------------------------------------------------------------

# 32. Quality Gates

### Gate A --- Architecture

No duplicate competing editor systems.

### Gate B --- Functional Editor

User can:

``` text
SELECT → EDIT → MUTATE
```

### Gate C --- Creation

``` text
ADD → MOVE → DELETE
```

### Gate D --- Persistence

``` text
SAVE → RELOAD → RECOVER
```

### Gate E --- Responsive

Desktop/Tablet/Mobile genuinely work.

### Gate F --- Production

Preview and Publish work against the real runtime.

### Gate G --- UX

Studio meets professional commercial-builder expectations.

------------------------------------------------------------------------

# 33. Definition of Done --- Studio V1

A real human must be able to:

``` text
1. Login
2. Open dashboard
3. Create/open project
4. Open Studio
5. Open Pages
6. Select a page
7. Open Components
8. Add Hero
9. Add Text
10. Add Image
11. Select components
12. Edit properties
13. See immediate Canvas updates
14. Reorder/move elements
15. Delete an element
16. Undo
17. Redo
18. Switch Desktop
19. Switch Tablet
20. Switch Mobile
21. Configure responsive behavior
22. Save
23. Reload
24. Confirm persistence
25. Preview
26. Publish
27. Open live website
28. Confirm published result
```

If a critical step fails, Studio V1 is incomplete.

------------------------------------------------------------------------

# 34. Priority Order

## P0 --- Product-breaking

-   Studio cannot load
-   Canvas broken
-   selection broken
-   editing broken
-   persistence broken
-   production deployment broken

## P1 --- Core Builder

-   Components
-   Inspector
-   Layout
-   Responsive
-   History
-   Assets
-   Preview
-   Publish

## P2 --- Professional UX

-   speed,
-   keyboard controls,
-   drag/drop,
-   polish,
-   discoverability.

## P3 --- Website / Commerce

-   SEO,
-   forms,
-   domains,
-   commerce,
-   analytics.

## P4 --- Advanced Platform

-   AI,
-   business apps,
-   mobile,
-   advanced automation.

## P5 --- Operator Expansion

-   advanced Mission Control,
-   automated diagnostics,
-   controlled tenant fixes,
-   feature delivery pipeline.

------------------------------------------------------------------------

# 35. What We Do Not Do Now

Until the professional builder is functional, do not prioritize:

-   mobile app builder,
-   large AI feature sets,
-   advanced Mission Control automation,
-   dozens of new domain engines,
-   cosmetic feature accumulation,
-   architecture rewrites without evidence,
-   additional abstractions that do not improve the user workflow.

Immediate objective:

> **Build the best possible SoloSpot Studio foundation.**

------------------------------------------------------------------------

# 36. Immediate Mission

## NIGHT SHIFT 22 --- REAL STUDIO FUNCTIONALITY RECOVERY

Purpose:

Determine the truth about the existing Builder architecture and recover
it into a functional editor.

The mission must establish whether:

``` text
A. Existing Builder is real but disconnected
B. Existing Builder is partial and needs integration
C. Existing G1-55–60 functionality was largely abstraction/test coverage without a complete product editor
```

Then act accordingly.

No fake implementation.

No cosmetic-only solution.

No arbitrary rewrite.

No scope drift.

------------------------------------------------------------------------

# 37. Strategic End State

``` text
                         SOLOSPOT
                            │
             ┌──────────────┴──────────────┐
             │                             │
       CUSTOMER SIDE                 OPERATOR SIDE
             │                             │
       USER DASHBOARD                 MISSION CONTROL
             │                             │
          STUDIO                     CUSTOMERS
             │                       TENANTS
       ┌─────┼─────┐                 STORES
       │     │     │                 DEPLOYMENTS
      SITE STORE  APP                INCIDENTS
       │     │     │                 REQUESTS
       └─────┼─────┘                 DIAGNOSTICS
             │                       AUDIT
             │                          │
             └──────────┬───────────────┘
                        │
                   PLATFORM CORE
                        │
              ┌─────────┼─────────┐
              │         │         │
           Runtime   Identity   Tenant
              │         │         │
              └─────────┼─────────┘
                        │
                   DOMAIN ENGINES
                        │
          ┌─────────────┼─────────────┐
          │             │             │
       Website       Commerce       Mobile
        Engine        Engine        Engine
          │             │             │
          └─────────────┼─────────────┘
                        │
                  LIVE CUSTOMER
                     BUSINESS
```

The customer builds.

SoloSpot runs it.

The customer reports a problem.

Mission Control identifies the exact tenant/store/deployment.

Diagnostics locate the issue.

A controlled engineering pipeline produces the fix.

The fix is tested.

The fix is deployed.

The live environment is verified.

The customer receives the result.

------------------------------------------------------------------------

# 38. Final North Star

SoloSpot should not become:

> another dashboard with a page editor.

It should become:

> **a complete platform for creating, launching and operating digital
> businesses.**

The Builder is the first critical gateway.

Therefore the immediate objective is not to make Studio merely look
better.

The immediate objective is to make Studio **real**.

Once the user can reliably create a production-quality website/store
from scratch, the rest of the platform can grow around that proven
foundation.

## MASTER PLAN PRINCIPLE

> **First make creation real. Then make operation powerful. Then make
> the platform autonomous.**
