/**
 * deviceProfile.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects the current device class (mobile / tablet / desktop) using reliable
 * browser APIs — no UA-sniffing alone. Falls back gracefully on older browsers.
 *
 * Returns a frozen profile object consumed by the PDF generation pipeline.
 */

/**
 * @typedef {'mobile'|'tablet'|'desktop'} DeviceClass
 * @typedef {{
 *   deviceClass: DeviceClass,
 *   quality: number,          // JPEG quality 0–1
 *   maxDim: number,           // maximum pixel dimension
 *   compress: boolean,        // force compression pass
 *   aggressiveMemory: boolean,// release canvas refs per-image
 *   batchWarningThreshold: number, // images count that triggers the large-batch toast
 * }} DeviceProfile
 */

/** @returns {DeviceClass} */
function detectDeviceClass() {
  const hasTouch = navigator.maxTouchPoints > 1 || 'ontouchstart' in window;
  const pointerCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  const smallScreen   = window.matchMedia?.('(max-width: 768px)').matches  ?? false;
  const medScreen     = window.matchMedia?.('(max-width: 1024px)').matches ?? false;

  if (hasTouch && smallScreen)  return 'mobile';
  if (hasTouch && medScreen)    return 'tablet';
  if (hasTouch && pointerCoarse && !smallScreen) return 'tablet'; // large touch (iPad Pro)
  return 'desktop';
}

/** @returns {number|null} Available device memory in GB, or null if unsupported */
function getDeviceMemory() {
  return navigator.deviceMemory ?? null; // Chrome / Edge only
}

/**
 * Returns the device profile for the current session.
 * Called once at generation start so it reflects real-time conditions.
 * @returns {DeviceProfile}
 */
export function getDeviceProfile() {
  const deviceClass = detectDeviceClass();
  const memoryGB    = getDeviceMemory();

  // Base profiles per device class
  const profiles = {
    desktop: {
      deviceClass:  'desktop',
      quality:       0.95,
      maxDim:        3000,
      compress:      false,
      aggressiveMemory: false,
      batchWarningThreshold: 100,
    },
    tablet: {
      deviceClass:  'tablet',
      quality:       0.90,
      maxDim:        2400,
      compress:      true,
      aggressiveMemory: false,
      batchWarningThreshold: 60,
    },
    mobile: {
      deviceClass:  'mobile',
      quality:       0.82,
      maxDim:        1600,
      compress:      true,
      aggressiveMemory: true,
      batchWarningThreshold: 30,
    },
  };

  const profile = { ...profiles[deviceClass] };

  // ── Memory-aware downgrade ───────────────────────────────────────────────
  // If device reports < 2 GB, tighten settings regardless of class
  if (memoryGB !== null && memoryGB < 2) {
    profile.quality  = Math.min(profile.quality, 0.80);
    profile.maxDim   = Math.min(profile.maxDim,  1200);
    profile.compress = true;
    profile.aggressiveMemory = true;
    profile.batchWarningThreshold = Math.min(profile.batchWarningThreshold, 25);
  }

  return Object.freeze(profile);
}
