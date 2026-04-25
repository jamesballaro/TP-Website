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
     */
    function init() {
      const root = document.documentElement;

      root.classList.add('js-ready');
    
      initCursorSparks();
      initVHSFeedback();
    }
  
  
    /* ─── Cursor sparks Sparks ──────────────────────────
    * Canvas overlay, pointer-events:none so it never blocks clicks.
    * Sparks only emit above a movement-speed threshold (feels like friction/sparks).
    * Skipped entirely on touch/coarse-pointer devices.
    */
    function initCursorSparks() {
      if (window.matchMedia('(pointer: coarse)').matches) return;
    
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'fixed', inset: '0',
        pointerEvents: 'none',
        zIndex: '9999',
      });
      document.body.appendChild(canvas);
    
      const ctx    = canvas.getContext('2d');
      const sparks = [];
    
      function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });
    
      let lastX = 0, lastY = 0;
    
      document.addEventListener('mousemove', (e) => {
        const dx    = e.clientX - lastX;
        const dy    = e.clientY - lastY;
        const speed = Math.sqrt(dx * dx + dy * dy);
        lastX = e.clientX;
        lastY = e.clientY;
    
        if (speed < 4) return;
    
        const count = Math.min(Math.ceil(speed / 4), 5);
        for (let i = 0; i < count; i++) {
          // Occasional long "shooter" spark mixed with short fizzers
          const isBig   = Math.random() < 0.2;
          const velModifier = 0.3;
          const vel     = isBig
            ? speed * (0.5 + Math.random() * 0.6) * velModifier
            : speed * (0.1 + Math.random() * 0.3) * velModifier;
          const angle   = Math.random() * Math.PI * 2;
    
          sparks.push({
            x:    e.clientX,
            y:    e.clientY,
            px:   e.clientX,   // previous position for streak
            py:   e.clientY,
            vx:   Math.cos(angle) * vel,
            vy:   Math.sin(angle) * vel - Math.random() * 2, // slight upward bias
            size: isBig ? Math.random() * 1.5 + 1 : Math.random() * 1 + 0.4,
            life: 1,
            decay: isBig
              ? 0.03 + Math.random() * 0.015
              : 0.06 + Math.random() * 0.03,
          });
        }
      }, { passive: true });
    
      // Colour: white-hot → gold → orange-amber as life falls
      function sparkColor(life) {
        if (life > 0.7) {
          // white → yellow
          const t = (1 - life) / 0.3;
          const g = Math.round(220 + 35 * (1 - t));
          return `rgb(255, ${g}, ${Math.round(180 * (1 - t))})`;
        } else if (life > 0.3) {
          // yellow → orange
          const t = (0.7 - life) / 0.4;
          return `rgb(255, ${Math.round(200 - 80 * t)}, 0)`;
        } else {
          // orange → dim red — almost gone
          const t = life / 0.3;
          return `rgb(${Math.round(180 * t + 60)}, ${Math.round(60 * t)}, 0)`;
        }
      }
    
      (function tick() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
    
          // Store trail start before update
          s.px  = s.x;
          s.py  = s.y;
          s.x  += s.vx;
          s.y  += s.vy;
          s.vy += 0.22;    // gravity
          s.vx *= 0.90;    // air drag
          s.vy *= 0.90;
          s.life -= s.decay;
    
          if (s.life <= 0) { sparks.splice(i, 1); continue; }
    
          const alpha = Math.pow(s.life, 1.5); // stays bright, drops fast at end
          const color = sparkColor(s.life);
    
          ctx.globalAlpha  = alpha;
          ctx.strokeStyle  = color;
          ctx.lineWidth    = s.size * s.life;
          ctx.lineCap      = 'round';
    
          // Glow — two passes: wide soft halo then tight bright core
          ctx.shadowColor  = 'rgba(255, 160, 20, 0.9)';
          ctx.shadowBlur   = 6;
    
          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
    
          // Bright white core overlay
          ctx.shadowBlur  = 2;
          ctx.strokeStyle = `rgba(255, 255, 220, ${alpha * 0.8})`;
          ctx.lineWidth   = s.size * s.life * 0.35;
          ctx.beginPath();
          ctx.moveTo(s.px, s.py);
          ctx.lineTo(s.x, s.y);
          ctx.stroke();
        }
    
        ctx.shadowBlur  = 0;
        ctx.globalAlpha = 1;
        requestAnimationFrame(tick);
      }());
    }
  
  
    /* ─── VHS Analog Feedback ─────────────────────────────────────────────
    * Self-referential canvas feedback loop, clipped to the hovered character.
    * Each frame the canvas is redrawn onto itself with a slight scale + upward drift
    * and a hue-rotate filter — hues cycle while content zooms and smears.
    * feedbackAlpha controls how much of the previous frame survives (decay rate).
    */
    function initVHSFeedback() {
      if (window.matchMedia('(pointer: coarse)').matches) return;
    
      /* ── Parameters ─────────────────────────────────────────────────────────── */
      const VHS = {
        REFRESH_FPS:   10,
        DECAY_RATE:    0.005,
        DRAG_STRENGTH: 0.003,
        DIVERGE:       150,
      };
    
      /* ── Canvases ────────────────────────────────────────────────────────────── */
      const canvas = document.createElement('canvas');
      Object.assign(canvas.style, {
        position: 'fixed', inset: '0',
        pointerEvents: 'none',
        zIndex: '0',
      });
      document.body.insertBefore(canvas, document.querySelector('.site-wrapper'));
      const ctx = canvas.getContext('2d');
    
      // Reusable tinting canvas — avoids allocating per frame per tick
      const tmp    = document.createElement('canvas');
      const tmpCtx = tmp.getContext('2d');
    
      let frames = [], activeEl = null, lastStampMs = 0;
    
      function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        frames = [];
      }
      resize();
      window.addEventListener('resize', resize, { passive: true });
    
      /* ── Colour trajectory: light blue → purple → black ─────────────────────────
       * t = 1 at birth, 0 at death.
       * Two linear segments meeting at t=0.5 (purple midpoint).
       * RGB computed directly — no ctx.filter, works in all browsers.
       * ─────────────────────────────────────────────────────────────────────────── */
      // ===== Trail Colour Parameters =====
        const TRAIL_COLOURS = {
          start: " #4e8dbc",   // brightest / newest particle
          mid:   " #8d2e9e",   // midpoint hue
          end:   " #540c50",   // fade-out colour
          opacity: 0.3
        };
        
        // ===== Utilities =====
        
        function lerp(a, b, t) {
          return a + (b - a) * t;
        }
        
        function hexToRgb(hex) {
          hex = hex.replace("#", "");
          if (hex.length === 3) {
            hex = hex.split("").map(c => c + c).join("");
          }
          const num = parseInt(hex, 16);
          return [
            (num >> 16) & 255,
            (num >> 8) & 255,
            num & 255
          ];
        }

        // ===== Utility =====
        function lerp(a, b, t) {
          return a + (b - a) * t;
        }

        // ===== Colour Function =====
        function trailColor(t) {

          const startRGB = hexToRgb(TRAIL_COLOURS.start);
        
          const midRGB   = hexToRgb(TRAIL_COLOURS.mid);
        
          const endRGB   = hexToRgb(TRAIL_COLOURS.end);
        
          let c0, c1, s;
        
          if (t > 0.5) {
        
            s = (t - 0.5) * 2;
        
            c0 = midRGB;
        
            c1 = startRGB;
        
          } else {
        
            s = t * 2;
        
            c0 = endRGB;
        
            c1 = midRGB;
        
          }
        
          const r = Math.round(lerp(c0[0], c1[0], s));
        
          const g = Math.round(lerp(c0[1], c1[1], s));
        
          const b = Math.round(lerp(c0[2], c1[2], s));
        
          return `rgba(${r}, ${g}, ${b}, ${TRAIL_COLOURS.opacity})`;
        
        }
    
      /* ── Correct for object-fit:contain letterboxing ─────────────────────────── */
      function getRenderedRect(img) {
        const r  = img.getBoundingClientRect();
        const na = img.naturalWidth / img.naturalHeight;
        const ba = r.width / r.height;
        let w, h;
        if (na > ba) { w = r.width;  h = r.width  / na; }
        else          { h = r.height; w = r.height * na; }
        return {
          left:   r.left + (r.width  - w) / 2,
          top:    r.top  + (r.height - h) / 2,
          width:  w,
          height: h,
        };
      }
    
      /* ── Event listeners ─────────────────────────────────────────────────────── */
      document.querySelectorAll('.band-member').forEach(el => {
        el.addEventListener('mouseenter', () => { activeEl = el; lastStampMs = 0; });
        el.addEventListener('mouseleave', () => { activeEl = null; });
      });
    
      /* ── Stamp: bake exact alpha-channel silhouette into offscreen ──────────────
       * Stored as a white alpha mask — colour is applied at draw time
       * so we can shift it cheaply each tick without touching this canvas.
       * ─────────────────────────────────────────────────────────────────────────── */
      function stamp() {
        const img = activeEl.querySelector('.character-img');
        const r   = getRenderedRect(img);
    
        const off    = document.createElement('canvas');
        off.width    = Math.ceil(r.width);
        off.height   = Math.ceil(r.height);
        const offCtx = off.getContext('2d');
    
        // White fill clipped to PNG alpha → pure alpha-channel silhouette mask
        offCtx.fillStyle = '#ffffff';
        offCtx.fillRect(0, 0, off.width, off.height);
        offCtx.globalCompositeOperation = 'destination-in';
        offCtx.drawImage(img, 0, 0, off.width, off.height);
    
        const angle = Math.random() * Math.PI * 2;
        frames.push({
          off,
          cx:     r.left + r.width  / 2,
          cy:     r.top  + r.height / 2,
          w:      r.width,
          h:      r.height,
          scale:  1.0,
          alpha:  0.88,
          driftX: Math.cos(angle),
          driftY: Math.sin(angle),
        });
      }
    
      /* ── Render loop ─────────────────────────────────────────────────────────── */
      function tick(timestamp) {
        requestAnimationFrame(tick);
    
        if (activeEl && (timestamp - lastStampMs) >= (1000 / VHS.REFRESH_FPS)) {
          stamp();
          lastStampMs = timestamp;
        }
    
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    
        for (let i = 0; i < frames.length; i++) {
          const f = frames[i];
          f.scale -= VHS.DRAG_STRENGTH;
          f.alpha -= VHS.DECAY_RATE;
          if (f.alpha <= 0 || f.scale <= 0) { frames.splice(i--, 1); continue; }
    
          // t drives both colour and divergence — guaranteed 1→0 over frame lifetime
          const t     = f.alpha / 0.88;
          const color = trailColor(t);
          const aged  = 1 - f.scale;
          const dx    = f.driftX * aged * VHS.DIVERGE;
          const dy    = f.driftY * aged * VHS.DIVERGE;
    
          // Tint the white alpha mask with the current trajectory colour.
          // 1. Fill tmp with computed colour
          // 2. destination-in with the silhouette mask → coloured silhouette
          // This is explicit RGB compositing — no ctx.filter hue-rotate.
          if (tmp.width  < f.w) tmp.width  = Math.ceil(f.w);
          if (tmp.height < f.h) tmp.height = Math.ceil(f.h);
          tmpCtx.clearRect(0, 0, tmp.width, tmp.height);
          tmpCtx.fillStyle = color;
          tmpCtx.fillRect(0, 0, f.w, f.h);
          tmpCtx.globalCompositeOperation = 'destination-in';
          tmpCtx.drawImage(f.off, 0, 0, f.w, f.h);
          tmpCtx.globalCompositeOperation = 'source-over';
    
          // Blurred glow pass
          ctx.save();
          ctx.filter      = 'blur(12px)';
          ctx.globalAlpha = f.alpha * 0.38;
          ctx.translate(f.cx + dx, f.cy + dy);
          ctx.scale(f.scale, f.scale);
          ctx.drawImage(tmp, 0, 0, f.w, f.h, -f.w / 2, -f.h / 2, f.w, f.h);
          ctx.restore();
    
          // Sharp silhouette pass
          ctx.save();
          ctx.globalAlpha = f.alpha;
          ctx.translate(f.cx + dx, f.cy + dy);
          ctx.scale(f.scale, f.scale);
          ctx.drawImage(tmp, 0, 0, f.w, f.h, -f.w / 2, -f.h / 2, f.w, f.h);
          ctx.restore();
        }
        ctx.filter = 'none';
      }
    
      requestAnimationFrame(tick);
    }
  
  
    /* ─── Bootstrap ─────────────────────────────────────────────────────────── */
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      // DOMContentLoaded already fired (script loaded defer/async late)
      init();
    }
  
  }());