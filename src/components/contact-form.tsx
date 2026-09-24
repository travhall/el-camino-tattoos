"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Artist = { slug: string; name: string };

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "error"; message: string };

// Netlify rejects a submission over 8MB in total, files and text combined.
// Leave headroom for the text fields.
const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;

// Netlify Forms takes one file per input, so references get one input each.
const referenceSlots = [1, 2, 3] as const;

/**
 * Netlify Forms inquiry form. With the Next runtime the page isn't static HTML,
 * so Netlify detects the form from public/__forms.html and this posts there.
 * It posts multipart (reference images are files), so no Content-Type header is
 * set and the browser adds the boundary. Without JavaScript the plain HTML POST
 * still works: Netlify redirects to /contact/thanks. Keep field names in sync
 * with public/__forms.html.
 */
export function ContactForm({ artists }: { artists: readonly Artist[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>({ state: "idle" });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "sending") return;

    const body = new FormData(event.currentTarget);
    let uploadBytes = 0;
    for (const [, value] of body) {
      if (value instanceof File) uploadBytes += value.size;
    }
    if (uploadBytes > MAX_UPLOAD_BYTES) {
      setStatus({
        state: "error",
        message: `Your images add up to ${(uploadBytes / 1024 / 1024).toFixed(1)}MB, and the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB combined. Try smaller versions, or leave them off and send them when we reply.`,
      });
      return;
    }

    setStatus({ state: "sending" });
    try {
      const response = await fetch("/__forms.html", { method: "POST", body });
      if (!response.ok) throw new Error(`Form post failed: ${response.status}`);
      router.push("/contact/thanks");
    } catch {
      setStatus({
        state: "error",
        message:
          "We couldn\u2019t send your message. Please try again in a moment.",
      });
    }
  }

  return (
    <form
      name="contact"
      method="post"
      action="/__forms.html"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      className="contact-form"
    >
      <input type="hidden" name="form-name" value="contact" />
      {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
      <p hidden>
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} />
        </label>
      </p>

      <div className="field">
        <label htmlFor="contact-name" className="field__label">
          Name
        </label>
        <input
          id="contact-name"
          name="name"
          type="text"
          autoComplete="name"
          required
          className="field__control"
        />
      </div>

      <div className="field">
        <label htmlFor="contact-email" className="field__label">
          Email
        </label>
        <input
          id="contact-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="field__control"
        />
      </div>

      <div className="field">
        <label htmlFor="contact-phone" className="field__label">
          Phone (optional)
        </label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="field__control"
        />
      </div>

      <div className="field">
        <label htmlFor="contact-artist" className="field__label">
          Artist (optional)
        </label>
        <select id="contact-artist" name="artist" className="field__control">
          <option value="">No preference, we&rsquo;ll match you</option>
          {artists.map((artist) => (
            <option key={artist.slug} value={artist.name}>
              {artist.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="contact-message" className="field__label">
          Tell us about your idea
        </label>
        <textarea
          id="contact-message"
          name="message"
          rows={6}
          required
          className="field__control"
        />
      </div>

      <div className="field">
        <label htmlFor="contact-placement" className="field__label">
          Placement
        </label>
        <input
          id="contact-placement"
          name="placement"
          type="text"
          required
          aria-describedby="contact-placement-hint"
          className="field__control"
        />
        <p id="contact-placement-hint" className="field__hint">
          Where on your body, as specific as you can. e.g. inner left forearm.
        </p>
      </div>

      <div className="field">
        <label htmlFor="contact-size" className="field__label">
          Approximate size
        </label>
        <input
          id="contact-size"
          name="size"
          type="text"
          required
          aria-describedby="contact-size-hint"
          className="field__control"
        />
        <p id="contact-size-hint" className="field__hint">
          A rough guess in inches is fine. e.g. 4 inches tall.
        </p>
      </div>

      <div className="field">
        <label htmlFor="contact-budget" className="field__label">
          Budget (optional)
        </label>
        <input
          id="contact-budget"
          name="budget"
          type="text"
          aria-describedby="contact-budget-hint"
          className="field__control"
        />
        <p id="contact-budget-hint" className="field__hint">
          Tell us what you&rsquo;re hoping to spend and we&rsquo;ll tell you
          what&rsquo;s realistic.
        </p>
      </div>

      <fieldset className="fieldset">
        <legend className="field__label">Color (optional)</legend>
        {["Black and gray", "Color", "Not sure"].map((option) => (
          <label key={option} className="check">
            <input type="radio" name="color" value={option} />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>

      <label className="check">
        <input type="checkbox" name="cover-up" value="yes" />
        <span>This covers up or reworks an existing tattoo</span>
      </label>

      <div className="field">
        <label htmlFor="contact-availability" className="field__label">
          Preferred days or time frame (optional)
        </label>
        <input
          id="contact-availability"
          name="availability"
          type="text"
          className="field__control"
        />
      </div>

      <fieldset className="fieldset">
        <legend className="field__label">Reference images (optional)</legend>
        <p id="contact-references-hint" className="field__hint">
          Photos, sketches or screenshots of what you have in mind. Up to three,{" "}
          {MAX_UPLOAD_BYTES / 1024 / 1024}MB combined.
        </p>
        {referenceSlots.map((slot) => (
          <input
            key={slot}
            type="file"
            name={`reference-${slot}`}
            accept="image/*"
            aria-label={`Reference image ${slot}`}
            aria-describedby="contact-references-hint"
            className="field__control"
          />
        ))}
      </fieldset>

      <p className="small muted">
        Fields marked optional can be skipped. Sending this doesn&rsquo;t book
        an appointment; we&rsquo;ll follow up to sort out the details.
      </p>

      {status.state === "error" && (
        <p role="alert" className="form-status">
          <strong>Something went wrong.</strong> {status.message}
        </p>
      )}

      <div>
        <Button type="submit" pending={status.state === "sending"}>
          {status.state === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
      {/* Present before it changes so screen readers announce the update. */}
      <p role="status" className="visually-hidden">
        {status.state === "sending" ? "Sending your message…" : ""}
      </p>
    </form>
  );
}
