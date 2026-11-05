import type { Section } from '../types';

export const GRID_COLUMNS = 10;
export const GRID_GAP = 16;
export const gridSpan = (percent: number) => Math.max(2, Math.ceil(percent / 10));

export function sectionsOverlap(left: Section, right: Section): boolean {
  return (
    (left.column ?? 0) < (right.column ?? 0) + gridSpan(right.width) &&
    (left.column ?? 0) + gridSpan(left.width) > (right.column ?? 0) &&
    (left.row ?? 0) < (right.row ?? 0) + gridSpan(right.height) &&
    (left.row ?? 0) + gridSpan(left.height) > (right.row ?? 0)
  );
}

export function canPlaceSection(section: Section, others: Section[]): boolean {
  const column = section.column ?? 0;
  const row = section.row ?? 0;
  return column >= 0 && column + gridSpan(section.width) <= GRID_COLUMNS && row >= 0 &&
    !others.some((other) => other.id !== section.id && sectionsOverlap(section, other));
}

export function findOpenPosition(section: Section, others: Section[]) {
  const lastRow = Math.max(0, ...others.map((other) => (other.row ?? 0) + gridSpan(other.height)));
  for (let row = 0; row <= lastRow; row++) {
    for (let column = 0; column <= GRID_COLUMNS - gridSpan(section.width); column++) {
      if (canPlaceSection({ ...section, row, column }, others)) return { row, column };
    }
  }
  return { row: lastRow, column: 0 };
}

/** Resolve occupied drops near the requested cell without moving existing cards. */
export function findNearestOpenPosition(section: Section, others: Section[], column: number, row: number) {
  const target = {
    column: Math.max(0, Math.min(GRID_COLUMNS - gridSpan(section.width), Math.round(column))),
    row: Math.max(0, Math.round(row)),
  };
  if (canPlaceSection({ ...section, ...target }, others)) return target;

  const obstacles = others.filter((other) => other.id !== section.id);
  // The nearest free rectangle must align with the target or an obstacle edge.
  const candidateRows = new Set([0, target.row, (section.row ?? 0) + 1]);
  for (const obstacle of obstacles) {
    candidateRows.add((obstacle.row ?? 0) + gridSpan(obstacle.height));
    candidateRows.add(Math.max(0, (obstacle.row ?? 0) - gridSpan(section.height)));
  }
  let best: { column: number; row: number; distance: number; beforeTarget: number; columnDistance: number } | null = null;
  for (const candidateRow of candidateRows) {
    for (let candidateColumn = 0; candidateColumn <= GRID_COLUMNS - gridSpan(section.width); candidateColumn++) {
      // An occupied drop should find a new slot rather than snap back to its source.
      if (candidateColumn === section.column && candidateRow === section.row) continue;
      const candidate = { column: candidateColumn, row: candidateRow };
      if (!canPlaceSection({ ...section, ...candidate }, obstacles)) continue;
      const columnDistance = Math.abs(candidateColumn - target.column);
      const distance = columnDistance + Math.abs(candidateRow - target.row);
      const beforeTarget = Number(candidateRow < target.row);
      if (!best || distance < best.distance ||
        (distance === best.distance && beforeTarget < best.beforeTarget) ||
        (distance === best.distance && beforeTarget === best.beforeTarget && columnDistance < best.columnDistance)) {
        best = { ...candidate, distance, beforeTarget, columnDistance };
      }
    }
  }

  // Below every obstacle is always an available slot on the unbounded canvas.
  return best ? { column: best.column, row: best.row } : {
    column: target.column,
    row: Math.max(target.row, ...obstacles.map((other) => (other.row ?? 0) + gridSpan(other.height))),
  };
}

/** Give old browser data coordinates once, preserving every existing explicit position. */
export function initializeSectionPositions(sections: Section[]): Section[] {
  const positioned = sections.filter((section) => section.column !== undefined && section.row !== undefined);
  return sections.map((section) => {
    if (section.column !== undefined && section.row !== undefined) return section;
    const result = { ...section, ...findOpenPosition(section, positioned) };
    positioned.push(result);
    return result;
  });
}

/** Growth keeps its anchor; only directly obstructed cards move down to make room. */
export function makeRoomForSection(sections: Section[], sectionId: string): Section[] {
  const result = [...sections];
  const anchor = result.find((section) => section.id === sectionId);
  if (!anchor) return sections;
  const queue = [anchor.id];
  while (queue.length) {
    const currentId = queue.shift();
    const current = result.find((section) => section.id === currentId)!;
    for (let index = 0; index < result.length; index++) {
      const other = result[index];
      if (other.id === current.id || other.id === sectionId || !sectionsOverlap(current, other)) continue;
      const moved = { ...other, row: (current.row ?? 0) + gridSpan(current.height) };
      result[index] = moved;
      if (!queue.includes(moved.id)) queue.push(moved.id);
    }
  }
  return result;
}
