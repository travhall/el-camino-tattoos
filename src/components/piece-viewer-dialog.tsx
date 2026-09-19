"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Native <dialog>: focus trap, Esc, inert background and focus restore come
 * from the platform. Closing (Esc, backdrop, button) pops the intercepted
 * route so the gallery underneath is exactly where the visitor left it.
 */
export function PieceViewerDialog({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="piece-title"
      onClose={() => router.back()}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}
      className="m-auto max-h-[92dvh] w-[min(64rem,calc(100vw-1.5rem))] overflow-auto overscroll-contain bg-background p-4 text-foreground backdrop:bg-black/80 md:p-6"
    >
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          className="rounded-full border border-foreground/30 px-4 py-1.5 text-sm hover:bg-foreground/10"
        >
          Close
        </button>
      </div>
      {children}
    </dialog>
  );
}
