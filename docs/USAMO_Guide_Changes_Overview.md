# USAMO Guide Transformation Overview

This document summarizes the major changes made to transform the USACO Guide codebase into USAMO Guide. It is an overview, not a complete changelog.

## Goals and Direction

- Rebrand the site and metadata to USAMO Guide.
- Replace competitive programming content with a math-competition curriculum.
- Preserve the existing Gatsby infrastructure, MDX pipeline, and search.
- Update problem sources, schemas, and editor tools to math contests.
- Remove USACO-specific assets, logic, and update workflows.

## Curriculum and Content Changes

- Replaced the section structure with four math-focused tracks: Foundations, Intermediate, Advanced, and USAMO.
- Added new MDX modules for arithmetic, algebra, counting, geometry, probability, number theory, and olympiad proof skills.
- Created matching .problems.json lists for AMC, AIME, and USAMO practice sources.
- Added a new authoring template for math topics in docs/Math_Topic_Template.md.
- Removed legacy competitive programming content, solutions, and storybook markdown folders.

## Branding and Metadata

- Updated site metadata, SEO defaults, and Open Graph titles for USAMO Guide.
- Replaced logos with a new USAMO mark and updated navigation logos.
- Updated landing page copy, FAQs, resources, and community links for math focus.
- Updated fonts and typography defaults to match the new visual direction.

## Problem System and Schemas

- Reworked problem sources to AMC 8, AMC 10, AMC 12, AIME, USAMO, AoPS Wiki, MAA, and Custom.
- Simplified solution metadata to math-friendly options and removed USACO-specific fields.
- Updated problems schemas in both content and static copies.
- Updated problem URL generation to match the new source and slug rules.

## UI and UX Adjustments

- Updated top navigation sections and resource links for USAMO content.
- Updated dashboard text and welcome banner to point to the new first module.
- Updated problem list presentation to remove USACO division table logic.
- Updated problem suggestion and autocomplete modals to USAMO sources.

## Groups and Submissions

- Simplified group problem submission to solution-link workflow only.
- Renamed group problem IDs and labels to match the new guide terminology.
- Updated group edit flows and copy to reference USAMO Guide.

## Editor and Contribution Tools

- Updated editor GitHub links, branch names, and schema URLs for the new repo.
- Updated documentation links in the editor and contribution guides.
- Updated PR template and contributing docs to reference the math topic template.

## Infrastructure and Services

- Updated analytics endpoints, Supabase config placeholders, and storage bucket names.
- Updated domain references to usamo.guide across the site.
- Removed USACO auto-update workflow and related scripts.
- Updated link checker to remove USACO-specific exclusions.

## Removed USACO-Specific Logic

- Removed USACO division tables and contest data assets.
- Removed USACO parser and related API wiring.
- Removed USACO content update scripts and repo references.
- Removed legacy redirects tied to USACO problem IDs.

## Notes and Follow-Ups

- Some generated build artifacts (public, .cache) may still show old content until a clean rebuild.
- After updating content and sources, run gatsby clean and rebuild to refresh derived data.
