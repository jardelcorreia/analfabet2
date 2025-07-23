// Polyfills for Node.js modules in the browser
// Polyfills for Node.js modules in the browser
console.log('[Polyfills Diagnostics] Top of polyfills.ts - typeof Error:', typeof Error, Error); // Early check for Error
console.log('[Polyfills Diagnostics] Buffer state from plugin (before any manual assignment attempt):', typeof globalThis.Buffer, globalThis.Buffer);

import { Buffer as BufferPolyfill } from 'buffer'; // Reinstated import
import processPolyfill from 'process'; // Use alias

console.log('[Polyfills] Start of polyfills.ts');
console.log('[Polyfills Diagnostics] Current typeof Error:', typeof Error, Error);
console.log('[Polyfills] typeof globalThis.Buffer before manual assignment (could be from plugin):', typeof globalThis.Buffer, globalThis.Buffer);


// Make Buffer and process available globally
if (typeof globalThis !== 'undefined') {
  globalThis.Buffer = BufferPolyfill; // Reinstated manual Buffer assignment
  globalThis.process = processPolyfill;
  console.log('[Polyfills] globalThis.Buffer MANUALLY assigned:', globalThis.Buffer);
  console.log('[Polyfills] globalThis.process assigned:', globalThis.process);
}

// Fallback for older browsers for process and Buffer
if (typeof window !== 'undefined') {
  // Assign only if not already assigned by globalThis or potentially by the plugin earlier
  if (!(window as any).Buffer) {  // Reinstated manual Buffer assignment for window
    (window as any).Buffer = BufferPolyfill;
    console.log('[Polyfills] window.Buffer MANUALLY assigned:', (window as any).Buffer);
  }
  if (!(window as any).process) {
    (window as any).process = processPolyfill;
    console.log('[Polyfills] window.process assigned:', (window as any).process);
  }
}

console.log('[Polyfills] End of polyfills.ts, final globalThis.Buffer (after manual assignment):', globalThis.Buffer);
console.log('[Polyfills Diagnostics] End of polyfills.ts - typeof Error:', typeof Error, Error); // Final check for Error in this file

// export { BufferPolyfill as Buffer, processPolyfill as process }; // Can keep commented, globals are primary