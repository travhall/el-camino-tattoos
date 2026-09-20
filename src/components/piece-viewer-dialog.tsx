"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

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
      className="viewer"
    >
      {/* Padding lives on this inner wrapper, not the <dialog>, so a click whose
          target is the dialog itself can only be a backdrop click. */}
      <div className="viewer__inner">
        <div className="viewer__bar">
          <Button
            variant="secondary"
            onClick={() => dialogRef.current?.close()}
          >
            Close
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
