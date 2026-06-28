// @vitest-environment jsdom

import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { describe, expect, it } from 'vitest';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from './alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from './dialog';
import { Label } from './label';

function render(element: React.ReactElement) {
  const container = document.createElement('div');
  document.body.append(container);
  const root = createRoot(container);

  act(() => {
    root.render(element);
  });

  return {
    unmount: () => {
      act(() => root.unmount());
      container.remove();
    },
  };
}

describe('Radix ui wrappers', () => {
  it('Dialog wrappers aceptan refs', () => {
    const contentRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descriptionRef = createRef<HTMLParagraphElement>();

    const view = render(
      <Dialog open>
        <DialogContent ref={contentRef}>
          <DialogTitle ref={titleRef}>Titulo</DialogTitle>
          <DialogDescription ref={descriptionRef}>
            Descripcion
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(descriptionRef.current).toBeInstanceOf(HTMLParagraphElement);

    view.unmount();
  });

  it('AlertDialog wrappers aceptan refs', () => {
    const contentRef = createRef<HTMLDivElement>();
    const titleRef = createRef<HTMLHeadingElement>();
    const descriptionRef = createRef<HTMLParagraphElement>();

    const view = render(
      <AlertDialog open>
        <AlertDialogContent ref={contentRef}>
          <AlertDialogTitle ref={titleRef}>Titulo</AlertDialogTitle>
          <AlertDialogDescription ref={descriptionRef}>
            Descripcion
          </AlertDialogDescription>
        </AlertDialogContent>
      </AlertDialog>,
    );

    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
    expect(titleRef.current).toBeInstanceOf(HTMLHeadingElement);
    expect(descriptionRef.current).toBeInstanceOf(HTMLParagraphElement);
    expect(document.querySelector('.bg-black\\/50')).not.toBeNull();
    expect(contentRef.current?.classList.contains('z-[60]')).toBe(true);
    expect(contentRef.current?.classList.contains('bg-white')).toBe(true);
    expect(contentRef.current?.classList.contains('p-6')).toBe(true);

    view.unmount();
  });

  it('Label acepta refs', () => {
    const labelRef = createRef<HTMLLabelElement>();

    const view = render(<Label ref={labelRef}>Nombre</Label>);

    expect(labelRef.current).toBeInstanceOf(HTMLLabelElement);

    view.unmount();
  });
});
