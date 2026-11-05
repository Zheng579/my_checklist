import type { Section } from '../types';
import { GRID_GAP } from './gridLayout';

/** Fit content in 10% steps while preserving a floor up to 50% of the viewport. */
export function fitSectionHeight(
  section: Pick<Section, 'height' | 'minHeight'>,
  contentHeight: number,
  viewportHeight: number,
  allowShrink = false,
) {
  const currentFloor = section.minHeight ?? Math.min(section.height, 50);
  const requiredHeight = Math.max(20, Math.ceil(((contentHeight + GRID_GAP) / viewportHeight) * 10) * 10);
  const height = Math.max(requiredHeight, allowShrink ? currentFloor : section.height);

  return { height, minHeight: Math.max(currentFloor, Math.min(height, 50)) };
}
