import {
  Check,
  Edit3,
  ListChecks,
  Plus,
  Save,
  Trash2,
} from 'lucide-react';
import { nextNumberedLabel } from '../data/naming';
import { useChecklistStore } from '../store/checklistStore';
import { Button } from './Button';
import { Dropdown } from './Dropdown';

export function Header() {
  const data = useChecklistStore((state) => state.data);
  const mode = useChecklistStore((state) => state.mode);
  const dirty = useChecklistStore((state) => state.dirty);
  const enterEditMode = useChecklistStore((state) => state.enterEditMode);
  const saveChanges = useChecklistStore((state) => state.saveChanges);
  const setActivePage = useChecklistStore((state) => state.setActivePage);
  const renameActivePage = useChecklistStore((state) => state.renameActivePage);
  const addPage = useChecklistStore((state) => state.addPage);
  const deleteActivePage = useChecklistStore((state) => state.deleteActivePage);
  const clearAll = useChecklistStore((state) => state.clearAll);
  const activePage = data.pages.find((page) => page.id === data.activePageId) ?? data.pages[0];

  const handleAddPage = () => {
    addPage(nextNumberedLabel('Page', data.pages.map((page) => page.title)));
  };

  const handleDeletePage = () => {
    if (data.pages.length === 1) return;
    if (window.confirm(`Delete “${activePage.title}” and all of its sections?`)) {
      deleteActivePage();
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear every checklist page and reset the application? This cannot be undone.')) {
      clearAll();
    }
  };

  return (
    <header className="app-header">
      <div className="header-brand" aria-label="Checklist Manager">
        <span className="brand-mark">
          <ListChecks size={22} strokeWidth={2.2} />
        </span>
        <span className="brand-name">Checklist</span>
      </div>

      <div className="title-field">
        <input
          id="checklist-title"
          aria-label="Checklist title"
          value={activePage.title}
          onChange={(event) => renameActivePage(event.target.value)}
          placeholder="Untitled checklist"
          maxLength={80}
        />
      </div>

      <div className="page-switcher">
        <Dropdown
          label="Checklist page"
          value={activePage.id}
          onSelect={setActivePage}
          icon={<ListChecks size={16} />}
          options={data.pages.map((page) => ({
            value: page.id,
            label: page.title || 'Untitled checklist',
            description: `${page.sections.length} ${page.sections.length === 1 ? 'container' : 'containers'}`,
          }))}
        />
        <Button size="sm" onClick={handleAddPage} aria-label="Add checklist page">
          <Plus size={16} />
          <span>New page</span>
        </Button>
        {mode === 'edit' && data.pages.length > 1 && (
          <Button size="sm" variant="ghost" onClick={handleDeletePage} aria-label="Delete current page">
            <Trash2 size={16} />
          </Button>
        )}
      </div>

      <div className="header-actions">
        <span className={`mode-label ${mode === 'edit' ? 'mode-label--edit' : ''}`}>
          {mode === 'edit' ? <Edit3 size={13} /> : <Check size={13} />}
          {mode === 'edit' ? (dirty ? 'Editing · Unsaved' : 'Editing') : 'View mode'}
        </span>
        {mode === 'view' ? (
          <Button variant="primary" onClick={enterEditMode}>
            <Edit3 size={16} />
            Edit
          </Button>
        ) : (
          <Button variant="primary" onClick={saveChanges}>
            <Save size={16} />
            Save
          </Button>
        )}
        <Button variant="danger" onClick={handleClear}>
          <Trash2 size={16} />
          <span>Clear data</span>
        </Button>
      </div>
    </header>
  );
}
