import { DEFAULT_PAGE_BACKGROUND } from './defaults';
import { initializeSectionPositions } from './gridLayout';
import type { ChecklistData, ChecklistPage } from '../types';

type StoredPage = Omit<ChecklistPage, 'backgroundColor'> & { backgroundColor?: string };

/** Version-1 data may still have a shared background instead of page backgrounds. */
export type StoredChecklistData = Omit<ChecklistData, 'pages'> & {
  backgroundColor?: string;
  pages: StoredPage[];
};

export function initializeChecklistData(data: StoredChecklistData): ChecklistData {
  const { backgroundColor: legacyBackground, ...current } = data;
  return {
    ...current,
    pages: data.pages.map((page) => ({
      ...page,
      backgroundColor: page.backgroundColor ?? legacyBackground ?? DEFAULT_PAGE_BACKGROUND,
      sections: initializeSectionPositions(page.sections),
    })),
  };
}
