import { useState } from 'react';
import { Check, ClipboardPaste, LayoutGrid, Plus } from 'lucide-react';
import { nextNumberedLabel } from '../data/naming';
import { useChecklistStore } from '../store/checklistStore';
import { Button } from './Button';
import { ColorPickerDialog } from './ColorPickerDialog';

export function EditToolbar() {
  const data = useChecklistStore((state) => state.data);
  const addSection = useChecklistStore((state) => state.addSection);
  const copiedSection = useChecklistStore((state) => state.copiedSection);
  const pasteSection = useChecklistStore((state) => state.pasteSection);
  const [pasted, setPasted] = useState(false);
  const setPageBackgroundColor = useChecklistStore((state) => state.setPageBackgroundColor);
  const activePage = data.pages.find((page) => page.id === data.activePageId) ?? data.pages[0];

  const handleAddSection = () => {
    addSection(nextNumberedLabel('Section', activePage.sections.map((section) => section.title)));
  };

  const handlePasteSection = () => {
    if (!pasteSection()) return;
    setPasted(true);
    window.setTimeout(() => setPasted(false), 1800);
  };

  return (
    <section className="edit-toolbar" aria-label="Checklist appearance and layout controls">
      <div className="edit-toolbar__intro">
        <span className="toolbar-icon"><LayoutGrid size={18} /></span>
        <strong>Layout studio</strong>
      </div>

      <div className="toolbar-actions">
        <ColorPickerDialog
          key={activePage.id}
          label="Page background"
          value={activePage.backgroundColor}
          onChange={(color) => setPageBackgroundColor(activePage.id, color)}
        />
        <Button
          onClick={handlePasteSection}
          disabled={!copiedSection}
          aria-label="Paste section into current page"
          title={copiedSection ? `Paste a copy of “${copiedSection.title}” into this page` : 'Copy a section first'}
        >
          {pasted ? <Check size={16} /> : <ClipboardPaste size={16} />}
          <span aria-live="polite">{pasted ? 'Section pasted' : 'Paste section'}</span>
        </Button>
        <Button variant="primary" onClick={handleAddSection}>
          <Plus size={16} />
          Add section
        </Button>
      </div>
    </section>
  );
}
