import type { CSSProperties } from "react";
import { RevealOnView } from "@/components/reveal-on-view";
import type { HomeContent } from "@/lib/content";

/**
 * The homepage's numbered steps (Pages → Home → What to expect): one panel
 * split into cells by hairlines, a row of five from lg. An ordered list, so
 * the order is in the markup as well as the visible numbers. Renders nothing
 * without steps.
 */
export function WhatToExpect({ steps }: { steps: HomeContent["steps"] }) {
  if (steps.items.length === 0) return null;
  return (
    <RevealOnView
      as="section"
      aria-labelledby="expect-heading"
      className="what-to-expect"
    >
      <h2 id="expect-heading" className="heading-1">
        {steps.heading || "What to expect"}
      </h2>
      <ol className="what-to-expect__list">
        {steps.items.map((item, index) => (
          <li
            key={item.title}
            className="what-to-expect__step"
            style={{ "--i": index } as CSSProperties}
          >
            <span className="what-to-expect__number" aria-hidden="true">
              {index + 1}
            </span>
            <h3 className="what-to-expect__title">{item.title}</h3>
            {item.text && <p className="what-to-expect__text">{item.text}</p>}
          </li>
        ))}
      </ol>
    </RevealOnView>
  );
}
