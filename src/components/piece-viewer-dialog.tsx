"use client";

import { getImageProps } from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { Photo } from "@/components/photo";
import { IconButton } from "@/components/ui/button";

/** One piece as the viewer needs it (serialized by PieceLightbox). */
export type ViewerPiece = {
  slug: string;
  title: string;
  image: string;
  alt: string;
  artist: { slug: string; name: string } | null;
  details: string[];
};

/** Zoom levels: the button and a click toggle between 1 and `zoomStep`. */
const zoomStep = 2.5;
const zoomMax = 4;
/** One arrow-key press pans a zoomed photo this far, in % of the box. */
const panStep = 10;
/** A horizontal drag this long (px) on an unzoomed photo is a swipe. */
const swipeMin = 50;

const clamp = (value: number, min = 0, max = 100) =>
  Math.min(max, Math.max(min, value));

/**
 * Native <dialog>, full screen: focus trap, inert background and focus
 * restore come from the platform. It opens with a reveal (.viewer in
 * components.css): the photo's panel sweeps down from the top edge while the
 * caption sheet rises from the bottom. Closing (Esc, the X, or a click on the
 * empty space around the photo) plays that in reverse, then pops the
 * intercepted route so the page underneath is exactly where the visitor
 * left it. The page behind doesn't scroll while it's open.
 *
 * Previous / next (the arrows in the sheet, ← and →, or a swipe) step
 * through the portfolio in place: the URL follows with replaceState, so each
 * piece keeps a shareable address and Close still returns to the page.
 *
 * Zoom: the Zoom button, a click or tap, or a pinch on the photo (the photo
 * only, not the page) scales it up; moving the pointer, dragging a finger,
 * or the arrow keys pan. Escape zooms out before it closes.
 *
 * Loading: until a photo arrives, its box shows a soft pulse; the photo then
 * fades in. The neighbours are preloaded, so stepping is quick.
 */
export function PieceViewerDialog({
  pieces,
  initialIndex,
}: {
  pieces: ViewerPiece[];
  initialIndex: number;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState<string | null>(null);
  const [direction, setDirection] = useState(0);
  // Touch bookkeeping, kept out of state: it changes on every pointermove.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startX: number;
    startY: number;
    pinchDistance?: number;
    pinchScale?: number;
    /** Set once two fingers were down: the rest of it is never a swipe. */
    pinched?: boolean;
    suppressClick?: boolean;
  } | null>(null);

  const piece = pieces[index];
  const zoomed = scale > 1;
  const previous = index > 0 ? pieces[index - 1] : null;
  const next = index < pieces.length - 1 ? pieces[index + 1] : null;

  // Load the neighbours ahead, at the same sources the viewer will ask
  // for, so a step shows a cached photo.
  for (const neighbour of [previous, next]) {
    if (!neighbour) continue;
    const { props } = getImageProps({
      src: neighbour.image,
      alt: "",
      fill: true,
      sizes: "100vw",
    });
    preload(props.src, {
      as: "image",
      imageSrcSet: props.srcSet,
      imageSizes: props.sizes,
    });
  }

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

  const setOrigin = (x: number, y: number) => {
    const box = mediaRef.current;
    if (!box) return;
    box.style.setProperty("--zoom-x", `${clamp(x)}%`);
    box.style.setProperty("--zoom-y", `${clamp(y)}%`);
  };

  const pointInBox = (clientX: number, clientY: number) => {
    const rect = mediaRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return [
      ((clientX - rect.left) / rect.width) * 100,
      ((clientY - rect.top) / rect.height) * 100,
    ] as const;
  };

  const applyScale = (value: number) => {
    mediaRef.current?.style.setProperty("--zoom-scale", String(value));
  };

  const zoomTo = (value: number) => {
    const next = clamp(value, 1, zoomMax);
    // Zooming in asks for a larger file: the photo's sizes go from one
    // screen to the zoomed width, and the browser picks a bigger source.
    const img = mediaRef.current?.querySelector<HTMLImageElement>(
      ".viewer__zoom-layer img",
    );
    if (next > 1 && img) img.sizes = `${Math.round(next * 100)}vw`;
    if (next === 1) setOrigin(50, 50);
    applyScale(next);
    setScale(next);
  };

  const go = (step: -1 | 1) => {
    const target = pieces[index + step];
    if (!target) return;
    zoomTo(1);
    setDirection(step);
    setIndex(index + step);
    window.history.replaceState(null, "", `/portfolio/${target.slug}`);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="piece-title"
      className="viewer"
      data-zoomed={zoomed || undefined}
      onCancel={(event) => {
        event.preventDefault();
        if (zoomed) zoomTo(1);
        else close();
      }}
      onClose={() => router.back()}
      onKeyDown={(event) => {
        const arrows: Record<string, [number, number]> = {
          ArrowLeft: [-1, 0],
          ArrowRight: [1, 0],
          ArrowUp: [0, -1],
          ArrowDown: [0, 1],
        };
        const arrow = arrows[event.key];
        if (!arrow) return;
        // Links and buttons keep their own keys only for Enter/Space, so
        // arrows are free to use anywhere in the dialog.
        if (zoomed) {
          event.preventDefault();
          const box = mediaRef.current;
          const current = (name: string) =>
            Number.parseFloat(box?.style.getPropertyValue(name) ?? "") || 50;
          setOrigin(
            current("--zoom-x") + arrow[0] * panStep,
            current("--zoom-y") + arrow[1] * panStep,
          );
        } else if (arrow[0] !== 0) {
          event.preventDefault();
          go(arrow[0] as -1 | 1);
        }
      }}
    >
      {/* A click on empty space (around the photo) closes; the photo zooms,
          and buttons and links do their own thing. The caption sheet is
          outside the stage. */}
      <div
        ref={stageRef}
        className="viewer__stage"
        onClick={(event) => {
          if (!(event.target as Element).closest(".viewer__media, button, a"))
            close();
        }}
      >
        {/* First in the DOM, so Close gets the dialog's initial focus. */}
        <div className="viewer__controls">
          <IconButton
            icon="close"
            label="Close"
            variant="ghost"
            onClick={close}
          />
          <IconButton
            icon={zoomed ? "zoom-out" : "zoom-in"}
            label="Zoom"
            variant="ghost"
            aria-pressed={zoomed}
            onClick={() => zoomTo(zoomed ? 1 : zoomStep)}
          />
        </div>

        {/* Pointer and touch route to what the buttons do: click or tap to
            zoom, pinch to zoom, drag or hover to pan, swipe to step. */}
        <div
          ref={mediaRef}
          className="viewer__media"
          data-loading={loaded !== piece.slug || undefined}
          aria-busy={loaded !== piece.slug || undefined}
          style={{ "--slide": direction } as React.CSSProperties}
          onPointerDown={(event) => {
            // Keep receiving moves when a finger leaves the box. Throws for
            // a pointer the browser doesn't know (synthetic events).
            try {
              event.currentTarget.setPointerCapture(event.pointerId);
            } catch {}
            pointers.current.set(event.pointerId, {
              x: event.clientX,
              y: event.clientY,
            });
            const touches = [...pointers.current.values()];
            if (touches.length === 1) {
              gesture.current = {
                startX: event.clientX,
                startY: event.clientY,
              };
            } else if (touches.length === 2) {
              const [a, b] = touches;
              gesture.current = {
                startX: event.clientX,
                startY: event.clientY,
                pinchDistance: Math.hypot(a.x - b.x, a.y - b.y),
                pinchScale: scale,
                pinched: true,
                suppressClick: true,
              };
              mediaRef.current?.setAttribute("data-pinching", "");
            }
          }}
          onPointerMove={(event) => {
            const tracked = pointers.current.has(event.pointerId);
            if (tracked) {
              pointers.current.set(event.pointerId, {
                x: event.clientX,
                y: event.clientY,
              });
            }
            const touches = [...pointers.current.values()];
            const pinch = gesture.current?.pinchDistance;
            if (touches.length === 2 && pinch) {
              const [a, b] = touches;
              const value = clamp(
                (gesture.current?.pinchScale ?? 1) *
                  (Math.hypot(a.x - b.x, a.y - b.y) / pinch),
                1,
                zoomMax,
              );
              const mid = pointInBox((a.x + b.x) / 2, (a.y + b.y) / 2);
              if (mid && (gesture.current?.pinchScale ?? 1) === 1)
                setOrigin(...mid);
              applyScale(value);
              return;
            }
            // Pan: a mouse just hovering, or one finger dragging.
            if (zoomed && (event.pointerType === "mouse" || tracked)) {
              const point = pointInBox(event.clientX, event.clientY);
              if (point) setOrigin(...point);
            }
          }}
          onPointerUp={(event) => {
            pointers.current.delete(event.pointerId);
            const current = gesture.current;
            if (current?.pinchDistance) {
              if (pointers.current.size < 2) {
                mediaRef.current?.removeAttribute("data-pinching");
                const value = Number.parseFloat(
                  mediaRef.current?.style.getPropertyValue("--zoom-scale") ??
                    "1",
                );
                // A pinch that barely zoomed settles back to fit.
                zoomTo(value < 1.15 ? 1 : value);
                gesture.current = { ...current, pinchDistance: undefined };
              }
              return;
            }
            if (!current) return;
            if (current.pinched) {
              if (pointers.current.size === 0)
                gesture.current = { ...current, pinched: false };
              return;
            }
            const dx = event.clientX - current.startX;
            const dy = event.clientY - current.startY;
            // A drag (to pan, or a swipe) isn't a tap: no zoom toggle after.
            if (Math.hypot(dx, dy) > 10) current.suppressClick = true;
            if (zoomed || event.pointerType === "mouse") return;
            if (Math.abs(dx) > swipeMin && Math.abs(dx) > Math.abs(dy)) {
              current.suppressClick = true;
              go(dx < 0 ? 1 : -1);
            }
          }}
          onPointerCancel={(event) => {
            pointers.current.delete(event.pointerId);
            mediaRef.current?.removeAttribute("data-pinching");
          }}
          onClick={(event) => {
            if (gesture.current?.suppressClick) {
              gesture.current = null;
              return;
            }
            if (!zoomed) {
              const point = pointInBox(event.clientX, event.clientY);
              if (point) setOrigin(...point);
            }
            zoomTo(zoomed ? 1 : zoomStep);
          }}
        >
          <div key={piece.slug} className="viewer__zoom-layer">
            <Photo
              src={piece.image}
              alt={piece.alt}
              fill
              priority
              sizes="100vw"
              className="image-contain"
              onLoad={() => setLoaded(piece.slug)}
            />
          </div>
        </div>
      </div>

      <div className="viewer__sheet">
        {/* Announced on each step, so a screen reader hears the new piece. */}
        <div className="viewer__caption" aria-live="polite">
          <h1 id="piece-title" className="viewer__title">
            {piece.title}
          </h1>
          <p className="viewer__details">
            {[
              piece.artist && (
                <span key="artist" className="viewer__detail">
                  by{" "}
                  <Link href={`/artists/${piece.artist.slug}`} className="link">
                    {piece.artist.name}
                  </Link>
                </span>
              ),
              ...piece.details.map((detail) => (
                <span key={detail} className="viewer__detail">
                  {detail}
                </span>
              )),
            ]}
          </p>
        </div>
        {pieces.length > 1 && (
          <div className="viewer__nav">
            <IconButton
              icon="arrow-left"
              label="Previous piece"
              variant="ghost"
              aria-disabled={!previous || undefined}
              onClick={() => go(-1)}
            />
            <span className="viewer__count">
              {index + 1}
              <span className="viewer__count-word"> of </span>
              <span aria-hidden="true"> / </span>
              {pieces.length}
            </span>
            <IconButton
              icon="arrow-right"
              label="Next piece"
              variant="ghost"
              aria-disabled={!next || undefined}
              onClick={() => go(1)}
            />
          </div>
        )}
      </div>
    </dialog>
  );
}
