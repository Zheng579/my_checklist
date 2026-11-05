import type { ChecklistData, ChecklistItem, ChecklistLevel, Section } from '../types';

export const DEFAULT_PAGE_BACKGROUND = '#FFFFFF';

export const makeId = () =>
  globalThis.crypto?.randomUUID?.() ?? `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const createItem = (text: string, level: ChecklistLevel = 1, children: ChecklistItem[] = []): ChecklistItem => ({
  id: makeId(),
  text,
  checked: false,
  expanded: true,
  highlighted: false,
  level,
  children,
});

export const createSection = (title = 'New section'): Section => ({
  id: makeId(),
  title,
  width: 50,
  height: 40,
  bgColor: '#FFFFFF',
  textColor: '#263238',
  theme: 'custom',
  items: [],
});

export const createDefaultData = (): ChecklistData => {
  const today = createSection('Today’s focus');
  today.width = 40;
  today.height = 50;
  today.items = [
    createItem('Set the day’s top priorities', 1, [
      createItem('Choose the most important outcome', 2),
      createItem('Block focused work time', 2),
    ]),
    createItem('Review messages and follow-ups'),
    createItem('Wrap up and plan tomorrow'),
  ];

  const project = createSection('Project pulse');
  project.width = 60;
  project.height = 50;
  project.bgColor = '#F5F5F5';
  project.items = [
    createItem('Design', 1, [
      createItem('Confirm the next milestone', 2),
      createItem('Share the latest review', 2),
    ]),
    createItem('Development', 1, [
      createItem('Complete the active task', 2),
      createItem('Run the quality checks', 2),
    ]),
  ];

  const notes = createSection('Weekly reset');
  notes.width = 100;
  notes.height = 30;
  notes.bgColor = '#CFD8DC';
  notes.items = [
    createItem('Clear completed tasks'),
    createItem('Capture loose notes'),
    createItem('Prepare next week’s plan'),
  ];

  const pageId = makeId();
  return {
    version: 1,
    activePageId: pageId,
    theme: 'custom',
    pages: [{ id: pageId, title: 'My checklist', backgroundColor: DEFAULT_PAGE_BACKGROUND, sections: [today, project, notes] }],
  };
};
