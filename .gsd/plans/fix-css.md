---
phase: 1
plan: fix-css
wave: 1
gap_closure: true
---

# Fix: Consolidate Scattered CSS

## Problem
There are CSS files that might have overlapping configuration styles due to the volume of CSS changes in components.

## Root Cause
Features were built incrementally without a strict single global baseline architecture for the "Industrial-Tech Premium" style.

## Tasks

<task type="auto">
  <name>Consolidate CSS Styles</name>
  <files>src/index.css, src/App.css, src/features/**/*.css</files>
  <action>Identify overlapping classes, merge them into index.css or a new design system CSS, and enforce the Industrial-Tech Premium baseline.</action>
  <verify>Check UI for visual regressions.</verify>
  <done>Fewer CSS files, cleaner cascade, no overlaps.</done>
</task>
