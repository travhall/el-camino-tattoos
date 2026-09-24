"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";

type Artist = { slug: string; name: string };

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "invalid"; count: number }
  | { state: "error"; message: string };

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

// Field name to message, so an error can be looked up and cleared by name.
type Errors = Record<string, string>;

// Netlify rejects a submission over 8MB in total, files and text combined.
// Leave headroom for the text fields.
const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;

// Netlify Forms takes one file per input, so references get one input each.
const referenceSlots = [1, 2, 3] as const;

// What to say when a required field is empty or malformed, by field name. The
// browser's own wording is the fallback for anything not listed.
const messages: Record<string, { missing: string; invalid?: string }> = {
  name: { missing: "Enter your name." },
  email: {
    missing: "Enter your email address.",
    invalid: "Enter an email address like name@example.com.",
  },
  message: { missing: "Tell us about your idea." },
  placement: { missing: "Tell us where on your body." },
  size: { missing: "Give us a rough size." },
};

function isControl(element: EventTarget): element is Control {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function messageFor(control: Control) {
  const text = messages[control.name];
  if (control.validity.valueMissing) {
    return text?.missing ?? control.validationMessage;
  }
  return text?.invalid ?? control.validationMessage;
}

// Once scripts run, take over validation from the browser so errors appear
// inline. The server-rendered form stays natively validated without scripts.
function takeOverValidation(form: HTMLFormElement | null) {
  if (form) form.noValidate = true;
}

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
  const [errors, setErrors] = useState<Errors>({});

  // A field that has an error re-checks as it is edited, so the message goes
  // away the moment it is fixed. Fields without an error stay quiet.
  function onInput(event: React.FormEvent<HTMLFormElement>) {
    const control = event.target;
    if (!isControl(control) || !errors[control.name]) return;
    const { name } = control;
    const message = control.validity.valid ? "" : messageFor(control);
    setErrors((current) => {
      const next = { ...current };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "sending") return;

    const form = event.currentTarget;
    const invalid = Array.from(form.elements)
      .filter(isControl)
      .filter((control) => control.willValidate && !control.validity.valid);
    if (invalid.length > 0) {
      setErrors(
        Object.fromEntries(
          invalid.map((control) => [control.name, messageFor(control)]),
        ),
      );
      setStatus({ state: "invalid", count: invalid.length });
      invalid[0].focus();
      return;
    }
    setErrors({});

    const body = new FormData(form);
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
        message: "We couldn’t send your message. Please try again in a moment.",
      });
    }
  }

  // Announced once, on submit, so fixing fields doesn't chatter.
  const announcement =
    status.state === "sending"
      ? "Sending your message…"
      : status.state === "invalid"
        ? `${status.count} ${status.count === 1 ? "field needs" : "fields need"} attention.`
        : "";

  return (
    <form
      ref={takeOverValidation}
      name="contact"
      method="post"
      action="/__forms.html"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      onInput={onInput}
      className="contact-form"
    >
      <input type="hidden" name="form-name" value="contact" />
      {/* Honeypot: hidden from people and assistive tech, bots fill it in. */}
      <p hidden>
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} />
        </label>
      </p>

      <Field id="contact-name" label="Name" error={errors.name}>
        {(control) => (
          <input
            {...control}
            name="name"
            type="text"
            autoComplete="name"
            required
          />
        )}
      </Field>

      <Field id="contact-email" label="Email" error={errors.email}>
        {(control) => (
          <input
            {...control}
            name="email"
            type="email"
            autoComplete="email"
            required
          />
        )}
      </Field>

      <Field id="contact-phone" label="Phone (optional)">
        {(control) => (
          <input {...control} name="phone" type="tel" autoComplete="tel" />
        )}
      </Field>

      <Field id="contact-artist" label="Artist (optional)">
        {(control) => (
          <select {...control} name="artist">
            <option value="">No preference, we&rsquo;ll match you</option>
            {artists.map((artist) => (
              <option key={artist.slug} value={artist.name}>
                {artist.name}
              </option>
            ))}
          </select>
        )}
      </Field>

      <Field
        id="contact-message"
        label="Tell us about your idea"
        error={errors.message}
      >
        {(control) => (
          <textarea {...control} name="message" rows={6} required />
        )}
      </Field>

      <Field
        id="contact-placement"
        label="Placement"
        hint="Where on your body, as specific as you can. e.g. inner left forearm."
        error={errors.placement}
      >
        {(control) => (
          <input {...control} name="placement" type="text" required />
        )}
      </Field>

      <Field
        id="contact-size"
        label="Approximate size"
        hint="A rough guess in inches is fine. e.g. 4 inches tall."
        error={errors.size}
      >
        {(control) => <input {...control} name="size" type="text" required />}
      </Field>

      <Field
        id="contact-budget"
        label="Budget (optional)"
        hint={
          <>
            Tell us what you&rsquo;re hoping to spend and we&rsquo;ll tell you
            what&rsquo;s realistic.
          </>
        }
      >
        {(control) => <input {...control} name="budget" type="text" />}
      </Field>

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

      <Field
        id="contact-availability"
        label="Preferred days or time frame (optional)"
      >
        {(control) => <input {...control} name="availability" type="text" />}
      </Field>

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
        {announcement}
      </p>
    </form>
  );
}
