"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { IconButton } from "@/components/ui/button";

/**
 * Native <dialog>, full screen: focus trap, inert background and focus
 * restore come from the platform. It opens with a reveal (.viewer in
 * components.css): the photo's panel sweeps down from the top edge while the
 * caption sheet rises from the bottom. Closing (Esc, the X, or a click on the
 * empty space around the photo) plays that in reverse, then pops the
 * intercepted route so the page underneath is exactly where the visitor
 * left it. The page behind doesn't scroll while it's open.
 */
export function PieceViewerDialog({
  media,
  caption,
}: {
  media: React.ReactNode;
  caption: React.ReactNode;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = previousOverflow;
    };
  }, []);

  // Play the exit, then close for real. The timeout is a backstop in case
  // animationend never fires (no animation support, or the tab is hidden).
  const close = useCallback(() => {
    const dialog = dialogRef.current;
    const stage = stageRef.current;
    if (!dialog?.open || dialog.hasAttribute("data-closing")) return;
    dialog.setAttribute("data-closing", "");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      dialog.close();
    };
    stage?.addEventListener("animationend", finish, { once: true });
    window.setTimeout(finish, 1000);
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="piece-title"
      className="viewer"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => router.back()}
    >
      {/* A click on empty space (around the photo, including the
          letterbox beside it) closes; the photo and buttons don't. The
          caption sheet is outside the stage. */}
      <div
        ref={stageRef}
        className="viewer__stage"
        onClick={(event) => {
          if (!(event.target as Element).closest("img, button, a")) close();
        }}
      >
        <div className="viewer__bar">
          <IconButton
            icon="close"
            label="Close"
            variant="ghost"
            className="viewer__close"
            onClick={close}
          />
        </div>
        <div className="viewer__media">{media}</div>
      </div>
      <div className="viewer__sheet">{caption}</div>
    </dialog>
  );
}
