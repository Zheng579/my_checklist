import { create } from 'zustand';
import { createDefaultData, createItem, createSection, makeId } from '../data/defaults';
import { removeItem, reorderSiblings, toggleHighlightSubtree, toggleItemChecked, updateItem } from '../data/tree';
import { themePresets } from '../data/themes';
import { fitSectionHeight } from '../data/sectionSizing';
import { duplicateSection } from '../data/sectionCopy';
import { findNearestOpenPosition, findOpenPosition, gridSpan, initializeSectionPositions, makeRoomForSection } from '../data/gridLayout';
import type { ChecklistData, ChecklistItem, Section, ThemeName } from '../types';

const STORAGE_KEY = 'checklist-manager:v1';

const initializeLayout = (data: ChecklistData): ChecklistData => ({
  ...data,
  pages: data.pages.map((page) => ({ ...page, sections: initializeSectionPositions(page.sections) })),
});

const loadData = (): ChecklistData => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return initializeLayout(createDefaultData());
    const parsed = JSON.parse(value) as ChecklistData;
    if (parsed.version !== 1 || !parsed.pages?.length) return initializeLayout(createDefaultData());
    return initializeLayout(parsed);
  } catch {
    return initializeLayout(createDefaultData());
  }
};

const writeData = (data: ChecklistData) => localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

interface StoreState {
  data: ChecklistData;
  mode: 'view' | 'edit';
  dirty: boolean;
  copiedSection: Section | null;
  enterEditMode: () => void;
  saveChanges: () => void;
  setActivePage: (pageId: string) => void;
  renameActivePage: (title: string) => void;
  addPage: (title: string) => void;
  deleteActivePage: () => void;
  clearAll: () => void;
  setBackgroundColor: (color: string) => void;
  applyTheme: (sectionId: string, theme: Exclude<ThemeName, 'custom'>) => void;
  addSection: (title: string) => void;
  copySection: (sectionId: string) => boolean;
  pasteSection: () => string | null;
  updateSection: (sectionId: string, patch: Partial<Section>) => void;
  resizeSection: (sectionId: string, width: number, height: number) => void;
  fitSectionToContent: (sectionId: string, contentHeight: number, viewportHeight: number, allowShrink?: boolean) => void;
  moveSection: (sectionId: string, column: number, row: number) => boolean;
  deleteSection: (sectionId: string) => void;
  addRootItem: (sectionId: string, text: string) => void;
  addChildItem: (sectionId: string, parentId: string, text: string) => void;
  editItemText: (sectionId: string, itemId: string, text: string) => void;
  deleteItem: (sectionId: string, itemId: string) => void;
  toggleChecked: (sectionId: string, itemId: string) => void;
  toggleExpanded: (sectionId: string, itemId: string) => void;
  toggleHighlight: (sectionId: string, itemId: string) => void;
  reorderItems: (
    sectionId: string,
    parentId: string | null,
    activeId: string,
    overId: string,
  ) => void;
}

export const useChecklistStore = create<StoreState>((set, get) => {
  const updateData = (updater: (data: ChecklistData) => ChecklistData, markDirty = true) => {
    const state = get();
    const next = updater(state.data);
    if (state.mode === 'edit') {
      set({ data: next, dirty: markDirty ? true : state.dirty });
    } else {
      writeData(next);
      set({ data: next });
    }
  };

  const updateActivePage = (
    data: ChecklistData,
    updater: (page: ChecklistData['pages'][number]) => ChecklistData['pages'][number],
  ): ChecklistData => ({
    ...data,
    pages: data.pages.map((page) => (page.id === data.activePageId ? updater(page) : page)),
  });

  const updateSectionItems = (
    data: ChecklistData,
    sectionId: string,
    updater: (items: ChecklistItem[]) => ChecklistItem[],
  ) =>
    updateActivePage(data, (page) => ({
      ...page,
      sections: page.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              items: updater(section.items),
            }
          : section,
      ),
    }));

  return {
    data: loadData(),
    mode: 'view',
    dirty: false,
    copiedSection: null,

    enterEditMode: () => set({ mode: 'edit', dirty: false }),
    saveChanges: () => {
      writeData(get().data);
      set({ mode: 'view', dirty: false });
    },
    setActivePage: (pageId) =>
      updateData((data) => ({ ...data, activePageId: pageId }), false),
    renameActivePage: (title) =>
      updateData((data) => updateActivePage(data, (page) => ({ ...page, title }))),
    addPage: (title) =>
      updateData((data) => {
        const pageId = makeId();
        return {
          ...data,
          activePageId: pageId,
          pages: [...data.pages, { id: pageId, title, sections: [] }],
        };
      }),
    deleteActivePage: () =>
      updateData((data) => {
        if (data.pages.length === 1) return data;
        const pages = data.pages.filter((page) => page.id !== data.activePageId);
        return { ...data, pages, activePageId: pages[0].id };
      }),
    clearAll: () => {
      localStorage.removeItem(STORAGE_KEY);
      set({ data: initializeLayout(createDefaultData()), mode: 'view', dirty: false, copiedSection: null });
    },
    setBackgroundColor: (backgroundColor) =>
      updateData((data) => ({ ...data, backgroundColor })),
    applyTheme: (sectionId, themeName) =>
      updateData((data) => {
        const theme = themePresets.find((item) => item.id === themeName);
        if (!theme) return data;
        return updateActivePage(data, (page) => ({
          ...page,
          sections: page.sections.map((section) =>
            section.id === sectionId
              ? {
                  ...section,
                  theme: theme.id,
                  bgColor: theme.section,
                  textColor: theme.text,
                }
              : section,
          ),
        }));
      }),
    addSection: (title) =>
      updateData((data) =>
        updateActivePage(data, (page) => {
          const section = createSection(title);
          return { ...page, sections: [...page.sections, { ...section, ...findOpenPosition(section, page.sections) }] };
        }),
      ),
    copySection: (sectionId) => {
      const { data } = get();
      const page = data.pages.find((item) => item.id === data.activePageId);
      const section = page?.sections.find((item) => item.id === sectionId);
      if (!section) return false;
      set({ copiedSection: structuredClone(section) });
      return true;
    },
    pasteSection: () => {
      const { data, copiedSection, mode } = get();
      const page = data.pages.find((item) => item.id === data.activePageId);
      if (mode !== 'edit' || !page || !copiedSection) return null;
      const copy = duplicateSection(copiedSection, page.sections);
      updateData((current) => updateActivePage(current, (activePage) => ({
        ...activePage,
        sections: [...activePage.sections, copy],
      })));
      return copy.id;
    },
    updateSection: (sectionId, patch) =>
      updateData((data) =>
        updateActivePage(data, (page) => ({
          ...page,
          sections: page.sections.map((section) =>
            section.id === sectionId ? { ...section, ...patch } : section,
          ),
        })),
      ),
    resizeSection: (sectionId, width, height) => {
      updateData((data) => updateActivePage(data, (page) => ({
        ...page,
        sections: makeRoomForSection(page.sections.map((section) => section.id === sectionId
          ? { ...section, width, height, column: Math.min(section.column ?? 0, 10 - gridSpan(width)), minHeight: Math.min(height, 50) }
          : section), sectionId),
      })));
    },
    moveSection: (sectionId, column, row) => {
      const state = get();
      const page = state.data.pages.find((item) => item.id === state.data.activePageId);
      const section = page?.sections.find((item) => item.id === sectionId);
      if (!page || !section) return false;
      get().updateSection(sectionId, findNearestOpenPosition(section, page.sections, column, row));
      return true;
    },
    fitSectionToContent: (sectionId, contentHeight, viewportHeight, allowShrink = false) => {
      if (viewportHeight <= 0) return;
      const state = get();
      const page = state.data.pages.find((item) => item.id === state.data.activePageId);
      const section = page?.sections.find((item) => item.id === sectionId);
      if (!section) return;
      const size = fitSectionHeight(section, contentHeight, viewportHeight, allowShrink);
      if (size.height === section.height && size.minHeight === section.minHeight) return;

      // A measured layout update must not create an unsaved-edit warning by itself.
      updateData((data) => updateActivePage(data, (activePage) => ({
        ...activePage,
        sections: makeRoomForSection(activePage.sections.map((item) => item.id === sectionId ? { ...item, ...size } : item), sectionId),
      })), false);
    },
    deleteSection: (sectionId) =>
      updateData((data) =>
        updateActivePage(data, (page) => ({
          ...page,
          sections: page.sections.filter((section) => section.id !== sectionId),
        })),
      ),
    addRootItem: (sectionId, text) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) => [...items, createItem(text)]),
      ),
    addChildItem: (sectionId, parentId, text) =>
      updateData((data) =>
        updateSectionItems(
          data,
          sectionId,
          (items) =>
            updateItem(items, parentId, (parent) => ({
              ...parent,
              expanded: true,
              children: [...parent.children, createItem(text, (parent.level + 1) as ChecklistItem['level'])],
            })),
        ),
      ),
    editItemText: (sectionId, itemId, text) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) =>
          updateItem(items, itemId, (item) => ({ ...item, text })),
        ),
      ),
    deleteItem: (sectionId, itemId) =>
      updateData((data) => updateSectionItems(data, sectionId, (items) => removeItem(items, itemId))),
    toggleChecked: (sectionId, itemId) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) => toggleItemChecked(items, itemId)),
      ),
    toggleExpanded: (sectionId, itemId) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) =>
          updateItem(items, itemId, (item) => ({ ...item, expanded: !item.expanded })),
        ),
      ),
    toggleHighlight: (sectionId, itemId) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) => toggleHighlightSubtree(items, itemId)),
      ),
    reorderItems: (sectionId, parentId, activeId, overId) =>
      updateData((data) =>
        updateSectionItems(data, sectionId, (items) =>
          reorderSiblings(items, parentId, activeId, overId),
        ),
      ),
  };
});
