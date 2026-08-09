/// <reference types="vite/client" />

/**
 * Injected by Vite's define config at build time.
 * Format: "022T-<base36 timestamp suffix>"
 * Changes with every dev-server restart or production build.
 * Used in Sync Status to verify desktop and iPhone are running the same bundle.
 */
declare const __BUILD_ID__: string;
