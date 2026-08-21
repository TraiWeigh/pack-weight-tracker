---
name: Photo List capture assignment
description: Product invariants for turning a retained Photo List capture into a visual Location or an Item.
---

Keep a Photo List capture at list level until the person explicitly classifies it. A cancellation must retain that capture for later classification; it must not create an item, category, or location.

An assignment must be idempotent for one pending capture. Photo List use can involve rapid mobile taps, so only one Location or Item may be committed from one captured image.

Photo Locations are a first-class visual organization surface even when no items have been assigned. Items silently use the structural `Items` category; people should choose photographed locations or Unassigned, not manage categories in this flow.

**Why:** The captured image represents an intentional, user-visible destination decision. Premature or duplicate commits create confusing unassigned gear and undermine photo-first organization.

**How to apply:** Preserve the pending image through source-sheet and assignment cancellation, consume it only in the atomic Location/Item commit, and keep the capture assignment UI independent from standard-list Camera/Photos behavior.