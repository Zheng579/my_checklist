import { useLayoutEffect, useRef } from 'react';
import { useChecklistStore } from '../store/checklistStore';
import type { ChecklistItem, Section } from '../types';

const countItems = (items: ChecklistItem[]): number =>
  items.reduce((total, item) => total + 1 + countItems(item.children), 0);

/** Measure content and footer, excluding the flexible space between them. */
export function useSectionAutoHeight(section: Section) {
  const contentRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const currentCount = useRef(countItems(section.items));
  const previousCount = useRef(currentCount.current);
  const requestMeasure = useRef<() => void>(() => {});
  const fitSectionToContent = useChecklistStore((state) => state.fitSectionToContent);
  currentCount.current = countItems(section.items);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    let frame = 0;
    const measure = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const height = content.offsetHeight + (footerRef.current?.offsetHeight ?? 0) + 2;
        const deletedItems = currentCount.current < previousCount.current;
        previousCount.current = currentCount.current;
        fitSectionToContent(section.id, height, window.innerHeight, deletedItems);
      });
    };
    requestMeasure.current = measure;
    const observer = new ResizeObserver(measure);
    observer.observe(content);
    if (footerRef.current) observer.observe(footerRef.current);
    window.addEventListener('resize', measure);
    measure();

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('resize', measure);
      requestMeasure.current = () => {};
    };
  }, [fitSectionToContent, section.id]);

  useLayoutEffect(() => requestMeasure.current(), [section.items, section.width, section.height]);

  return { contentRef, footerRef };
}
