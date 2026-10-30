# TV return and Live TV Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a launchable Live TV card, installed-app selection, and safe original-launcher return controls.

**Architecture:** Extend the shared design app record with an optional Android package name while keeping existing JSON valid. The Android view discovers launchable packages, persists selected catalog metadata, and routes special settings rows to explicit system intents.

**Tech Stack:** Kotlin/Android TV, Next.js/TypeScript, JUnit, Node test runner.

**Spec:** `docs/superpowers/specs/2026-10-30-tv-return-and-live-tv-design.md`

## Global Constraints

- Do not alter `com.google.android.apps.tv.launcherx`, `com.google.android.tvlauncher`, firmware, boot logo, system partition, or signature checks.
- Preserve REA files and existing design JSON compatibility.
- Keep `DockApp` limited to 12 selected cards and never launch a package outside the user-selected catalog except the Live TV/system-return actions.

## Review Focus

- Existing exported JSON without `packageName` still parses unchanged; Task 1 tests it.
- A user app whose label duplicates a brand name launches its explicit package; Task 2 tests launch target selection.
- A device without Live TV opens input settings rather than crashing; Task 2 tests fallback intent construction.
- Original launcher absence leaves the HOME setting usable; Task 2 tests candidate discovery returns null safely.
- Browser-exported package metadata survives parse/export; Task 1 tests round-trip.

---

### Task 1: Shared app metadata and Live TV card

**Files:**
- Modify: `android/core/src/main/kotlin/dev/evekrani/a850c/core/Design.kt`, `Parse.kt`, `Serialize.kt`, `Marks.kt`
- Modify: `lib/design.ts`, `lib/marks.ts`, `components/app-marks.tsx`
- Test: `android/core/src/test/kotlin/dev/evekrani/a850c/core/CoreTest.kt`, `tests/*.test.ts`

**Interfaces:**
- Produces `DockApp.packageName: String?` and `AppMark.CANLI_TV`.

- [ ] Write failing JSON round-trip/default-card tests.
- [ ] Run the focused core and TypeScript tests; expect missing property/mark failures.
- [ ] Add optional package metadata and a drawn TV glyph, plus default Canlı TV card.
- [ ] Re-run focused tests; expect pass.
- [ ] Commit task.

### Task 2: Android launch and settings controls

**Files:**
- Modify: `android/app/src/main/kotlin/dev/evekrani/a850c/HomeView.kt`
- Test: `android/core/src/test/kotlin/dev/evekrani/a850c/core/CoreTest.kt`

**Interfaces:**
- Consumes `DockApp.packageName` and `AppMark.CANLI_TV`.
- Produces catalog refresh, explicit package launch, Live TV fallback and system HOME settings routing.

- [ ] Write failing tests for catalog package metadata and special card classification.
- [ ] Run core tests; expect failure.
- [ ] Discover launchable activities, store selected package metadata, and route settings actions.
- [ ] Run Android core tests and assemble debug APK.
- [ ] Commit task.

### Task 3: Browser controls and delivery

**Files:**
- Modify: `components/design-editor.tsx`, `components/appearance-panel.tsx`, `README.md`, preview files
- Test: `tests/*.test.ts`, `tests/*.spec.ts`

**Interfaces:**
- Consumes optional `packageName` as a portable design field.

- [ ] Write failing browser/unit assertions for the Canlı TV card and explanatory catalog copy.
- [ ] Run tests; expect failure.
- [ ] Update browser designer, documentation, offline preview and APK artifact.
- [ ] Run all tests/builds and commit task.
