import { useRef, useState, type CSSProperties } from 'react';
import {
  DndContext,
  AutoScrollActivator,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { LayoutDashboard, Plus } from 'lucide-react';
import { nextNumberedLabel } from '../data/naming';
import { findNearestOpenPosition, GRID_COLUMNS, GRID_GAP, gridSpan } from '../data/gridLayout';
import { useChecklistStore } from '../store/checklistStore';
import { Button } from './Button';
import { SectionCard } from './SectionCard';

export function PageGrid() {
  const data = useChecklistStore((state) => state.data);
  const mode = useChecklistStore((state) => state.mode);
  const addSection = useChecklistStore((state) => state.addSection);
  const moveSection = useChecklistStore((state) => state.moveSection);
  const activePage = data.pages.find((page) => page.id === data.activePageId) ?? data.pages[0];
  const gridRef = useRef<HTMLElement>(null);
  const [preview, setPreview] = useState<{ id: string; column: number; row: number; relocated: boolean } | null>(null);
  const [notice, setNotice] = useState('');
  const keyboardCoordinates: KeyboardCoordinateGetter = (event, { currentCoordinates }) => {
    const bounds = gridRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const stepX = (bounds.width + GRID_GAP) / GRID_COLUMNS;
    const stepY = window.innerHeight / 10;
    switch (event.code) {
      case 'ArrowRight': return { ...currentCoordinates, x: currentCoordinates.x + stepX };
      case 'ArrowLeft': return { ...currentCoordinates, x: currentCoordinates.x - stepX };
      case 'ArrowDown': return { ...currentCoordinates, y: currentCoordinates.y + stepY };
      case 'ArrowUp': return { ...currentCoordinates, y: currentCoordinates.y - stepY };
    }
  };
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }),
  );

  const getDropPosition = ({ active, delta }: DragMoveEvent | DragEndEvent) => {
    const bounds = gridRef.current?.getBoundingClientRect();
    const origin = active.rect.current.initial;
    const section = activePage.sections.find((item) => item.id === active.id);
    if (!bounds || !origin || !section) return null;
    const translated = active.rect.current.translated;
    const left = translated?.left ?? origin.left + delta.x;
    const top = translated?.top ?? origin.top + delta.y;
    const column = Math.max(0, Math.min(GRID_COLUMNS - gridSpan(section.width),
      Math.round((left - bounds.left) / ((bounds.width + GRID_GAP) / GRID_COLUMNS))));
    const row = Math.max(0, Math.round((top - bounds.top) / (window.innerHeight / 10)));
    const position = findNearestOpenPosition(section, activePage.sections, column, row);
    return {
      id: section.id,
      ...position,
      relocated: position.column !== column || position.row !== row,
    };
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const position = getDropPosition(event);
    if (position) {
      moveSection(position.id, position.column, position.row);
      setNotice(position.relocated ? 'Container placed in the nearest available space.' : 'Container position updated.');
    }
    setPreview(null);
  };

  const handleFirstSection = () => {
    addSection(nextNumberedLabel('Section', activePage.sections.map((section) => section.title)));
  };

  if (!activePage.sections.length) {
    return (
      <section className="empty-page">
        <span className="empty-page__icon"><LayoutDashboard size={28} /></span>
        <h2>This page is ready for your plan</h2>
        <p>{mode === 'edit' ? 'Create a section, then fill it with checklist items.' : 'Switch to Edit Mode to add your first section.'}</p>
        {mode === 'edit' && (
          <Button variant="primary" onClick={handleFirstSection}>
            <Plus size={16} /> Add first section
          </Button>
        )}
      </section>
    );
  }

  const previewSection = activePage.sections.find((section) => section.id === preview?.id);
  const rows = Math.max(10,
    ...activePage.sections.map((section) => (section.row ?? 0) + gridSpan(section.height) + (mode === 'edit' ? 4 : 0)),
    preview && previewSection ? preview.row + gridSpan(previewSection.height) + 2 : 0);

  return (
    <>
      {mode === 'edit' && (
        <div className="grid-instructions" role="status">
          {notice || 'Move cards with their grip. Empty grid cells stay available. Use arrow keys after pressing Space on a grip.'}
        </div>
      )}
      <DndContext
        sensors={sensors}
        autoScroll={{
          activator: AutoScrollActivator.Pointer,
          acceleration: 3,
          interval: 20,
          threshold: { x: 0.05, y: 0.08 },
          layoutShiftCompensation: false,
        }}
        onDragMove={(event) => setPreview(getDropPosition(event))}
        onDragCancel={() => setPreview(null)}
        onDragEnd={handleDragEnd}
      >
        <main
          ref={gridRef}
          className={`sections-grid ${mode === 'edit' ? 'sections-grid--editing' : ''}`}
          style={{ '--canvas-rows': rows, '--grid-gap': `${GRID_GAP}px` } as CSSProperties}
          aria-label={`${activePage.title} sections`}
        >
          {preview && previewSection && (
            <div
              className={`grid-drop-preview ${preview.relocated ? 'grid-drop-preview--relocated' : ''}`}
              style={{
                gridColumn: `${preview.column + 1} / span ${gridSpan(previewSection.width)}`,
                gridRow: `${preview.row + 1} / span ${gridSpan(previewSection.height)}`,
              }}
              aria-hidden="true"
            >
              <span>{preview.relocated ? 'Nearest available space' : 'Place here'}</span>
            </div>
          )}
          {activePage.sections.map((section) => (
            <SectionCard key={section.id} section={section} editMode={mode === 'edit'} />
          ))}
        </main>
      </DndContext>
    </>
  );
}
