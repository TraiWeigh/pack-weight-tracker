/**
 * PhotoCollections.tsx — retained for reference / compatibility.
 *
 * As of Prompt 016A, all photo-collection logic has been consolidated into
 * BackgroundPicker.tsx.  This file is no longer imported by BackgroundPicker.
 * It is kept so that any direct imports elsewhere do not break at compile time.
 *
 * The component exported here is a no-op placeholder.
 */

export function PhotoCollections(_props: {
  background: unknown;
  onBackgroundChange: (bg: unknown) => void;
}): null {
  return null;
}
