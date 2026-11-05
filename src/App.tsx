import { useEffect } from 'react';
import { EditToolbar } from './components/EditToolbar';
import { Header } from './components/Header';
import { PageGrid } from './components/PageGrid';
import { useChecklistStore } from './store/checklistStore';

export default function App() {
  const backgroundColor = useChecklistStore((state) => state.data.backgroundColor);
  const mode = useChecklistStore((state) => state.mode);
  const dirty = useChecklistStore((state) => state.dirty);

  useEffect(() => {
    const warnAboutUnsavedChanges = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
      event.returnValue = 'You have unsaved changes. Discard changes?';
    };
    window.addEventListener('beforeunload', warnAboutUnsavedChanges);
    return () => window.removeEventListener('beforeunload', warnAboutUnsavedChanges);
  }, [dirty]);

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.app-header');
    if (!header) return;
    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
    };
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty('--header-height');
    };
  }, []);

  return (
    <div className="app-shell" style={{ backgroundColor }}>
      <Header />
      <div className="workspace">
        {mode === 'edit' && <EditToolbar />}
        <PageGrid />
      </div>
    </div>
  );
}
