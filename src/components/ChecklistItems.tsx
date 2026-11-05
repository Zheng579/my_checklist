import { useState, type KeyboardEvent } from 'react';
import {
  Check,
  ChevronDown,
  ChevronUp,
  GripVertical,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { nextNumberedLabel } from '../data/naming';
import { useChecklistStore } from '../store/checklistStore';
import type { ChecklistItem } from '../types';

interface ChecklistItemsProps {
  sectionId: string;
  items: ChecklistItem[];
  parentId: string | null;
  editMode: boolean;
}

const descendants = (item: ChecklistItem): ChecklistItem[] =>
  item.children.flatMap((child) => [child, ...descendants(child)]);

export function ChecklistItems({
  sectionId,
  items,
  parentId,
  editMode,
}: ChecklistItemsProps) {
  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <div className={parentId ? 'nested-list' : 'checklist-list'} role="list">
        {items.map((item) => (
          <ChecklistRow
            key={item.id}
            item={item}
            sectionId={sectionId}
            parentId={parentId}
            editMode={editMode}
          />
        ))}
      </div>
    </SortableContext>
  );
}

interface ChecklistRowProps {
  sectionId: string;
  item: ChecklistItem;
  parentId: string | null;
  editMode: boolean;
}

function ChecklistRow({ sectionId, item, parentId, editMode }: ChecklistRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const toggleChecked = useChecklistStore((state) => state.toggleChecked);
  const toggleExpanded = useChecklistStore((state) => state.toggleExpanded);
  const toggleHighlight = useChecklistStore((state) => state.toggleHighlight);
  const editItemText = useChecklistStore((state) => state.editItemText);
  const addChildItem = useChecklistStore((state) => state.addChildItem);
  const deleteItem = useChecklistStore((state) => state.deleteItem);
  const hasChildren = item.children.length > 0;
  const allDescendants = descendants(item);
  const mixed = hasChildren && !item.checked && allDescendants.some((node) => node.checked);
  const highlighted = item.highlighted;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: !editMode,
    data: { type: 'item', sectionId, parentId },
  });

  const commitEdit = () => {
    const text = draft.trim();
    if (text && text !== item.text) editItemText(sectionId, item.id, text);
    if (!text) setDraft(item.text);
    setEditing(false);
  };

  const handleEditKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commitEdit();
    if (event.key === 'Escape') {
      setDraft(item.text);
      setEditing(false);
    }
  };

  const handleAddChild = () => {
    if (item.level >= 5) return;
    addChildItem(
      sectionId,
      item.id,
      nextNumberedLabel('Item', item.children.map((child) => child.text)),
    );
  };

  const handleDelete = () => {
    if (parentId !== null || !hasChildren) {
      deleteItem(sectionId, item.id);
      return;
    }
    if (window.confirm(`Delete this parent line${hasChildren ? ' and all of its children' : ''}?`)) {
      deleteItem(sectionId, item.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`checklist-node ${isDragging ? 'checklist-node--dragging' : ''}`}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      role="listitem"
    >
      <div
        className={`checklist-row ${highlighted ? 'checklist-row--highlighted' : ''} ${item.checked ? 'checklist-row--checked' : ''}`}
        onClick={() => toggleHighlight(sectionId, item.id)}
        onDoubleClick={(event) => {
          if (!editMode) return;
          event.stopPropagation();
          setDraft(item.text);
          setEditing(true);
        }}
      >
        {editMode && (
          <button
            type="button"
            className="item-grip"
            aria-label={`Reorder ${item.text}`}
            onClick={(event) => event.stopPropagation()}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={15} />
          </button>
        )}

        {hasChildren ? (
          <button
            type="button"
            className="expand-button"
            aria-label={item.expanded ? `Collapse ${item.text}` : `Expand ${item.text}`}
            aria-expanded={item.expanded}
            onClick={(event) => {
              event.stopPropagation();
              toggleExpanded(sectionId, item.id);
            }}
          >
            {item.expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        ) : (
          <span className="expand-spacer" aria-hidden="true" />
        )}

        <button
          type="button"
          role="checkbox"
          aria-checked={mixed ? 'mixed' : item.checked}
          aria-label={`${item.checked ? 'Uncheck' : 'Check'} ${item.text}`}
          className={`round-checkbox ${item.checked ? 'round-checkbox--checked' : ''} ${mixed ? 'round-checkbox--mixed' : ''}`}
          onClick={(event) => {
            event.stopPropagation();
            toggleChecked(sectionId, item.id);
          }}
        >
          {mixed ? <Minus size={13} strokeWidth={3} /> : item.checked ? <Check size={13} strokeWidth={3} /> : null}
        </button>

        {editing ? (
          <input
            className="item-edit-input"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleEditKey}
            onClick={(event) => event.stopPropagation()}
            autoFocus
            maxLength={240}
          />
        ) : (
          <span className="item-text">{item.text}</span>
        )}

        {editMode && (
          <div
            className="item-controls"
            onClick={(event) => event.stopPropagation()}
            onDoubleClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              aria-label={`Add child to ${item.text}`}
              onClick={handleAddChild}
              disabled={item.level >= 5}
              title={item.level >= 5 ? 'Maximum depth reached' : 'Add child item'}
            >
              <Plus size={15} />
            </button>
            <button type="button" aria-label={`Delete ${item.text}`} onClick={handleDelete}>
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {hasChildren && item.expanded && (
        <ChecklistItems
          sectionId={sectionId}
          items={item.children}
          parentId={item.id}
          editMode={editMode}
        />
      )}
    </div>
  );
}
