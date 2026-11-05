import { useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDraggable,
  type DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, ClipboardPaste, Copy, CopyPlus, GripVertical, Maximize2, Plus, Trash2 } from 'lucide-react';
import { nextNumberedLabel } from '../data/naming';
import { GRID_GAP, gridSpan } from '../data/gridLayout';
import { useSectionAutoHeight } from '../hooks/useSectionAutoHeight';
import { useChecklistStore } from '../store/checklistStore';
import type { Section } from '../types';
import { copyToClipboard, readColorsFromClipboard } from '../utils/clipboard';
import { Button } from './Button';
import { ChecklistItems } from './ChecklistItems';
import { SectionColorMenu } from './SectionColorMenu';

interface SectionCardProps {
  section: Section;
  editMode: boolean;
}

const snap = (value: number) => Math.max(20, Math.round(value / 10) * 10);

export function SectionCard({ section, editMode }: SectionCardProps) {
  const [dragNotice, setDragNotice] = useState('');
  const [colorsCopied, setColorsCopied] = useState(false);
  const [pasteStatus, setPasteStatus] = useState('');
  const [sectionCopied, setSectionCopied] = useState(false);
  const copySection = useChecklistStore((state) => state.copySection);
  const updateSection = useChecklistStore((state) => state.updateSection);
  const resizeSection = useChecklistStore((state) => state.resizeSection);
  const deleteSection = useChecklistStore((state) => state.deleteSection);
  const addRootItem = useChecklistStore((state) => state.addRootItem);
  const reorderItems = useChecklistStore((state) => state.reorderItems);
  const { contentRef, footerRef } = useSectionAutoHeight(section);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: section.id,
    disabled: !editMode,
    data: { type: 'section' },
  });
  const cardStyle = useMemo(
    () => ({
      '--section-bg': section.bgColor,
      '--section-text': section.textColor,
      '--section-height': `calc(${section.height}vh - ${GRID_GAP}px)`,
      gridColumn: `${(section.column ?? 0) + 1} / span ${gridSpan(section.width)}`,
      gridRow: `${(section.row ?? 0) + 1} / span ${gridSpan(section.height)}`,
      transform: CSS.Translate.toString(transform),
    }) as React.CSSProperties,
    [section.bgColor, section.textColor, section.height, section.width, section.column, section.row, transform],
  );

  const handleAddItem = () => {
    addRootItem(
      section.id,
      nextNumberedLabel('Item', section.items.map((item) => item.text)),
    );
  };

  const handleCopyColors = async () => {
    await copyToClipboard(`Background: ${section.bgColor}\nText: ${section.textColor}`);
    setColorsCopied(true);
    window.setTimeout(() => setColorsCopied(false), 1800);
  };

  const handleCopySection = () => {
    if (!copySection(section.id)) return;
    setSectionCopied(true);
    window.setTimeout(() => setSectionCopied(false), 1800);
  };

  const handlePasteColors = async () => {
    try {
      const colors = await readColorsFromClipboard();
      if (!colors) {
        setPasteStatus('Invalid colors');
      } else {
        updateSection(section.id, {
          bgColor: colors.background,
          textColor: colors.text,
          theme: 'custom',
        });
        setPasteStatus('Pasted');
      }
    } catch {
      setPasteStatus('Clipboard blocked');
    }
    window.setTimeout(() => setPasteStatus(''), 2200);
  };

  const handleDeleteSection = () => {
    if (window.confirm(`Delete the “${section.title}” section and all of its items?`)) {
      deleteSection(section.id);
    }
  };

  const handleItemDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const activeData = active.data.current;
    const overData = over.data.current;
    const sameLevel =
      activeData?.type === 'item' &&
      overData?.type === 'item' &&
      activeData.parentId === overData.parentId;
    if (!sameLevel) {
      setDragNotice('Items can only move within the same hierarchy level.');
      window.setTimeout(() => setDragNotice(''), 2600);
      return;
    }
    reorderItems(section.id, activeData.parentId as string | null, String(active.id), String(over.id));
  };

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const grid = event.currentTarget.closest('.sections-grid');
    const gridWidth = grid?.getBoundingClientRect().width ?? window.innerWidth;
    const startX = event.clientX;
    const startY = event.clientY + window.scrollY;
    const startWidth = section.width;
    const startHeight = section.height;

    const move = (pointerEvent: PointerEvent) => {
      const width = Math.min(100, snap(startWidth + ((pointerEvent.clientX - startX) / gridWidth) * 100));
      const height = snap(startHeight + ((pointerEvent.clientY + window.scrollY - startY) / window.innerHeight) * 100);
      resizeSection(section.id, width, height);
    };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', end);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', end, { once: true });
  };

  return (
    <article
      ref={setNodeRef}
      className={`section-card ${isDragging ? 'section-card--dragging' : ''}`}
      style={cardStyle}
    >
      <div className="section-content" ref={contentRef}>
        <div className="section-header">
          <div className="section-heading">
            {editMode && (
              <button
                type="button"
                className="section-grip"
                aria-label={`Move ${section.title} section`}
                {...attributes}
                {...listeners}
              >
                <GripVertical size={18} />
              </button>
            )}
            {editMode ? (
              <input
                className="section-title-input"
                value={section.title}
                onChange={(event) => updateSection(section.id, { title: event.target.value })}
                aria-label="Section title"
                maxLength={80}
              />
            ) : (
              <h2>{section.title}</h2>
            )}
          </div>
          <div className="section-header-actions">
            <span className="item-count">
              {section.items.length} {section.items.length === 1 ? 'group' : 'groups'}
            </span>
            <button
              type="button"
              className="copy-section"
              onClick={handleCopySection}
              aria-label={`Copy ${section.title} section`}
              title="Copy this section, including its checklist and appearance"
            >
              {sectionCopied ? <Check size={14} /> : <CopyPlus size={14} />}
              <span>{sectionCopied ? 'Copied' : 'Copy section'}</span>
            </button>
          </div>
        </div>

        {editMode && (
          <div className="section-settings">
            <span className="size-readout" title="Section size">
              <Maximize2 size={13} /> {section.width}% × {section.height}%
            </span>
            <SectionColorMenu section={section} />
            <button
              type="button"
              className="copy-colors"
              onClick={handleCopyColors}
              aria-label={`Copy background and text colors for ${section.title}`}
              title={`Copy background ${section.bgColor} and text ${section.textColor}`}
            >
              {colorsCopied ? <Check size={14} /> : <Copy size={14} />}
              <span>{colorsCopied ? 'Copied' : 'Copy colors'}</span>
            </button>
            <button
              type="button"
              className="copy-colors"
              onClick={handlePasteColors}
              aria-label={`Paste background and text colors into ${section.title}`}
              title="Paste colors copied from another container"
            >
              {pasteStatus === 'Pasted' ? <Check size={14} /> : <ClipboardPaste size={14} />}
              <span>{pasteStatus || 'Paste colors'}</span>
            </button>
            <button type="button" className="delete-section" onClick={handleDeleteSection}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}

        {dragNotice && <div className="drag-notice" role="status">{dragNotice}</div>}

        <div className="section-body">
          {section.items.length ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <ChecklistItems
                sectionId={section.id}
                items={section.items}
                parentId={null}
                editMode={editMode}
              />
            </DndContext>
          ) : (
            <div className="empty-section">
              <span className="empty-check">✓</span>
              <p>No items yet</p>
              {editMode && <small>Add the first item to start this section.</small>}
            </div>
          )}
        </div>
      </div>

      {editMode && (
        <div className="section-footer" ref={footerRef}>
          <Button size="sm" variant="ghost" onClick={handleAddItem}>
            <Plus size={15} /> Add item
          </Button>
          <span>Drag the corner to resize</span>
        </div>
      )}

      {editMode && (
        <button
          type="button"
          className="resize-handle"
          onPointerDown={startResize}
          aria-label={`Resize ${section.title} section`}
          title="Drag to resize in 10% steps"
        />
      )}
    </article>
  );
}
