---
phase: 1
plan: fix-testing
wave: 1
gap_closure: true
---

# Fix: Expand Testing Coverage

## Problem
Testing coverage is currently low. Only utilities are covered, leaving complex logic (like project creation, team member invitation) untested.

## Root Cause
Initial setup focused on core utilities first. No component or complex integration tests were set up yet.

## Tasks

<task type="auto">
  <name>Setup Component Tests Environment</name>
  <files>package.json, vite.config.js</files>
  <action>Add testing libraries if needed (e.g. `@testing-library/react`, `jsdom`) and configure vitest environment.</action>
  <verify>Run a basic component test correctly.</verify>
  <done>Testing environment ready for components.</done>
</task>

<task type="manual">
  <name>Write Critical Logic Tests</name>
  <files>src/features/projects/hooks/*.test.js</files>
  <action>Write unit tests for complex hooks (`useProjects` / `useMembers`).</action>
  <verify>Run tests and ensure they pass.</verify>
  <done>Tests pass successfully.</done>
</task>
