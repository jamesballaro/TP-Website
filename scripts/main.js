/**
 * main.js — Truthpaste
 * Phase 1: Minimal bootstrap. No active features.
 *
 * This file exists to:
 *   1. Mark the DOM as JS-capable (for progressive enhancement)
 *   2. Document the exact integration points for Phase 2 features
 *   3. Provide a clean, single entry-point for all future JS
 *
 * Phase 2 features that will attach here:
 *   ─ Custom cursor (trailing / morph effect)
 *   ─ Character hover animations (per-member, triggered on mouseenter)
 *   ─ Page section transitions (SPA-style, if adopted)
 *   ─ Mailing list modal / inline form
 */

(function () {
    'use strict';
  
    /* ─── Selectors ────────────────────────────────────────────────────────────
     * Cache DOM references once on init; pass into feature modules as needed.
     * Do NOT query the DOM outside of init() or a DOMContentLoaded callback.
     */
    const selectors = {
      siteWrapper:  '.site-wrapper',
      logo:         '.logo-link',
      bandNav:      '.band-nav',
      bandMembers:  '.band-member',      // NodeList
      characterImg: '.character-img',    // NodeList
    };
  
  
    /* ─── Init ─────────────────────────────────────────────────────────────────
     * Single entry point. Call sub-initialisers here as features land.
     */
    function init() {
      const root = document.documentElement;
  
      // Signal to CSS that JS is available.
      // Allows .js-* state classes and JS-dependent transitions.
      root.classList.add('js-ready');
  
      // ── Phase 2 hooks (uncomment and implement as needed) ──────────────────
  
      // initCursor();          // Custom pointer + trail effect
      // initMemberHovers();    // Per-character animation on mouseenter
      // initNavTransitions();  // Smooth section reveals on nav click
      // initMailingList();     // Inline form / modal for mailing-list link
    }
  
  
    /* ─── Phase 2: Custom Cursor ───────────────────────────────────────────────
     * Attach to: document, or scoped to .site-wrapper.
     * Use a separate cursor.js module; import/call from here.
     *
     * function initCursor() {
     *   import('./cursor.js').then(m => m.init());
     * }
     */
  
  
    /* ─── Phase 2: Member Hover Animations ─────────────────────────────────────
     * Each .band-member carries data-member="james|theo|claire|euan|fifth".
     * Use this to drive member-specific animations (e.g. wobble, float).
     *
     * function initMemberHovers() {
     *   const members = document.querySelectorAll(selectors.bandMembers);
     *   members.forEach(el => {
     *     const name = el.dataset.member;
     *     el.addEventListener('mouseenter', () => animateMember(name, el));
     *     el.addEventListener('mouseleave', () => resetMember(name, el));
     *   });
     * }
     */
  
  
    /* ─── Bootstrap ─────────────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // DOMContentLoaded already fired (script loaded defer/async late)
      init();
    }
  
  }());