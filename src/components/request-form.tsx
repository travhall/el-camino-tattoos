"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, IconButton } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icon";
import { RadioTabs } from "@/components/ui/radio-tabs";

/*
 * PROTOTYPE (/contact/next). The redesigned request form from the contact
 * audit, built beside the live ContactForm so /contact doesn't change until
 * this is approved. Same Netlify form ("contact"), same field names where a
 * field carries over; new names (topic, contact-method) are registered in
 * public/__forms.html.
 *
 * Changes from ContactForm:
 * - "A new tattoo" / "A question" tabs first (RadioTabs). A question hides
 *   the tattoo fields with CSS (:has), so it works before scripts run too.
 * - Short by default: the idea and photos, then how to reach you, then
 *   Send. Everything else is optional and folded into "Add details"
 *   (opened, or the artist kept outside it, when ?artist= picked one).
 * - Only the description, name and email are required.
 * - Size, colour and timing are choice chips (radios) instead of free text.
 * - "How should we reply?" comes before the phone field, which shows (and
 *   is required) only for a text reply.
 * - What happens next sits right above Send.
 * - One "Add photos" picker for up to three, with thumbnails, that shrinks
 *   each photo to 2000px before sending (phone photos alone used to blow
 *   the 7MB limit). Without scripts the three plain file inputs show.
 * - A draft (typed fields and choices) is kept in this browser until it's
 *   sent.
 */

type Artist = { slug: string; name: string };

type Status =
  | { state: "idle" }
  | { state: "sending" }
  | { state: "invalid"; count: number }
  | { state: "error"; message: string };

type Control = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
type Errors = Record<string, string>;
type Photo = { file: File; url: string };

const MAX_UPLOAD_BYTES = 7 * 1024 * 1024;
const MAX_PHOTOS = 3;
const MAX_EDGE = 2000;
const DRAFT_KEY = "contact-request-draft";
// Fields worth keeping if the visitor leaves or the send fails: typed ones
// and the artist (by value), and the radio choices (by checking one).
const draftFields = [
  "message",
  "placement",
  "budget",
  "artist",
  "name",
  "email",
  "phone",
] as const;
const draftChoices = [
  "topic",
  "color",
  "size",
  "availability",
  "contact-method",
] as const;

const messages: Record<string, { missing: string; invalid?: string }> = {
  name: { missing: "Enter your name." },
  email: {
    missing: "Enter your email address.",
    invalid: "Enter an email address like name@example.com.",
  },
  message: { missing: "Tell us what you have in mind." },
  question: { missing: "Tell us what you'd like to know." },
  phone: { missing: "Add a number we can text, or choose email." },
};

const sizes = ["Small", "Medium", "Large", "Bigger", "Not sure"];
const colors = ["Black and gray", "Color", "Not sure"];
const timings = ["As soon as possible", "Weekdays", "Weekends", "Flexible"];

// True once hydrated (false in the server HTML), without an effect.
const noop = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

function isControl(element: unknown): element is Control {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLSelectElement ||
    element instanceof HTMLTextAreaElement
  );
}

function messageFor(control: Control) {
  const asking =
    control.name === "message" &&
    control.form?.querySelector(
      'input[name="topic"][value="A question"]:checked',
    );
  const text = messages[asking ? "question" : control.name];
  if (control.validity.valueMissing || control.validity.customError) {
    return text?.missing ?? control.validationMessage;
  }
  return text?.invalid ?? control.validationMessage;
}

/** Shrinks a photo to MAX_EDGE on its long side as a JPEG. Keeps the
 * original if it's already small, if shrinking doesn't help, or if the
 * browser can't decode it (HEIC in Chrome). */
async function shrink(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) return file;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas
      .getContext("2d")
      ?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85),
    );
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

/** Radios drawn as chips (.choice-chip): selected is fill AND weight. */
function ChoiceChips({
  name,
  options,
  defaultValue,
}: {
  name: string;
  options: readonly string[];
  defaultValue?: string;
}) {
  return (
    <div className="choice-list">
      {options.map((option) => (
        <label key={option} className="choice-chip">
          <input
            type="radio"
            name={name}
            value={option}
            defaultChecked={option === defaultValue}
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

export function RequestForm({
  artists,
  defaultArtist,
  depositAmount,
}: {
  artists: readonly Artist[];
  /** An artist's name to preselect (from ?artist= on the page). */
  defaultArtist?: string;
  /** Shown in "What happens next"; left out when not set. */
  depositAmount?: number | null;
}) {
  const router = useRouter();
  const form = useRef<HTMLFormElement>(null);
  const slots = useRef<(HTMLInputElement | null)[]>([]);
  const enhanced = useHydrated();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [preparing, setPreparing] = useState(false);
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [errors, setErrors] = useState<Errors>({});

  // Once scripts run: take over validation from the browser and bring back
  // a saved draft (only into fields that are still empty).
  useEffect(() => {
    const element = form.current;
    if (!element) return;
    element.noValidate = true;
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "{}");
      for (const name of draftFields) {
        const control = element.elements.namedItem(name);
        if (isControl(control) && typeof saved[name] === "string") {
          control.value ||= saved[name];
        }
      }
      for (const name of draftChoices) {
        if (typeof saved[name] !== "string" || !saved[name]) continue;
        const radio = element.querySelector<HTMLInputElement>(
          `input[name="${name}"][value="${CSS.escape(saved[name])}"]`,
        );
        if (radio) radio.checked = true;
      }
      syncPhoneRule();
    } catch {
      // No storage (private window, blocked): start empty.
    }
  }, []);

  // The three named file inputs Netlify reads always mirror the picker.
  useEffect(() => {
    slots.current.forEach((input, index) => {
      if (!input) return;
      const transfer = new DataTransfer();
      if (photos[index]) transfer.items.add(photos[index].file);
      input.files = transfer.files;
    });
  }, [photos]);

  // Free the photo previews when the form goes (after sending, say).
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(
    () => () =>
      photosRef.current.forEach((photo) => URL.revokeObjectURL(photo.url)),
    [],
  );

  function saveDraft() {
    const element = form.current;
    if (!element) return;
    try {
      const data = new FormData(element);
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify(
          Object.fromEntries(
            [...draftFields, ...draftChoices].map((name) => [
              name,
              data.get(name) ?? "",
            ]),
          ),
        ),
      );
    } catch {
      // Storage full or blocked: the draft is a convenience, skip it.
    }
  }

  // Texting needs a number: the phone field is required only then.
  function syncPhoneRule() {
    const element = form.current;
    const phone = element?.elements.namedItem("phone");
    if (!element || !(phone instanceof HTMLInputElement)) return;
    const text = element.querySelector<HTMLInputElement>(
      'input[name="contact-method"][value="Text me"]',
    );
    phone.setCustomValidity(
      text?.checked && !phone.value.trim() ? messages.phone.missing : "",
    );
  }

  function onInput(event: React.FormEvent<HTMLFormElement>) {
    saveDraft();
    syncPhoneRule();
    const control = event.target;
    if (!isControl(control)) return;
    // Re-check fields that already show an error (the phone also when the
    // reply method changes), so a message goes as soon as it's fixed.
    const name = control.name === "contact-method" ? "phone" : control.name;
    const field = form.current?.elements.namedItem(name);
    if (!isControl(field)) return;
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      if (field.validity.valid) delete next[name];
      else next[name] = messageFor(field);
      return next;
    });
  }

  async function addPhotos(files: File[]) {
    const room = MAX_PHOTOS - photos.length;
    const picked = files
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, room);
    if (picked.length === 0) return;
    setPreparing(true);
    const ready = await Promise.all(picked.map(shrink));
    setPreparing(false);
    setPhotos((current) =>
      [
        ...current,
        ...ready.map((file) => ({ file, url: URL.createObjectURL(file) })),
      ].slice(0, MAX_PHOTOS),
    );
  }

  function removePhoto(index: number) {
    setPhotos((current) => {
      URL.revokeObjectURL(current[index].url);
      return current.filter((_, i) => i !== index);
    });
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status.state === "sending" || preparing) return;
    syncPhoneRule();

    const element = event.currentTarget;
    const invalid = Array.from(element.elements)
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

    const body = new FormData(element);
    let uploadBytes = 0;
    for (const [, value] of body) {
      if (value instanceof File) uploadBytes += value.size;
    }
    if (uploadBytes > MAX_UPLOAD_BYTES) {
      setStatus({
        state: "error",
        message: `Your photos add up to ${(uploadBytes / 1024 / 1024).toFixed(1)}MB, and the limit is ${MAX_UPLOAD_BYTES / 1024 / 1024}MB. Remove one, or send them when we reply.`,
      });
      return;
    }

    setStatus({ state: "sending" });
    try {
      const response = await fetch("/__forms.html", { method: "POST", body });
      if (!response.ok) throw new Error(`Form post failed: ${response.status}`);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // Nothing to clear.
      }
      router.push("/contact/thanks");
    } catch {
      setStatus({
        state: "error",
        message:
          "We couldn’t send your request. Your answers are still here, so please try again in a moment.",
      });
    }
  }

  const announcement =
    status.state === "sending"
      ? "Sending your request…"
      : status.state === "invalid"
        ? `${status.count} ${status.count === 1 ? "field needs" : "fields need"} attention.`
        : "";

  const artistField = (
    <Field
      id="request-artist"
      // Inside "Add details (optional)" it needn't say so again.
      label={defaultArtist ? "Artist (optional)" : "Artist"}
    >
      {(control) => (
        <select {...control} name="artist" defaultValue={defaultArtist ?? ""}>
          <option value="">No preference, we&rsquo;ll match you</option>
          {artists.map((artist) => (
            <option key={artist.slug} value={artist.name}>
              {artist.name}
            </option>
          ))}
        </select>
      )}
    </Field>
  );

  return (
    <form
      ref={form}
      name="contact"
      method="post"
      action="/__forms.html"
      encType="multipart/form-data"
      onSubmit={onSubmit}
      onInput={onInput}
      className="request-form"
    >
      <input type="hidden" name="form-name" value="contact" />
      <p hidden>
        <label>
          Leave this empty: <input name="bot-field" tabIndex={-1} />
        </label>
      </p>

      <RadioTabs
        name="topic"
        legend="What's this about?"
        options={["A new tattoo", "A question"]}
      />

      <section aria-labelledby="request-idea" className="request-form__section">
        <h2 id="request-idea" className="heading-4">
          <span className="request-form__tattoo-only">Your idea</span>
          <span className="request-form__question-only">Your question</span>
        </h2>

        <Field
          id="request-message"
          label={
            <>
              <span className="request-form__tattoo-only">
                Describe the tattoo
              </span>
              <span className="request-form__question-only">
                What would you like to know?
              </span>
            </>
          }
          hint={
            <span className="request-form__tattoo-only">
              Subject, style, where it goes, what it means to you. Rough is
              fine.
            </span>
          }
          error={errors.message}
        >
          {(control) => (
            <textarea {...control} name="message" rows={4} required />
          )}
        </Field>

        <fieldset className="fieldset request-form__tattoo-only">
          <legend className="field__label">Photos (optional)</legend>
          <p id="request-photos-hint" className="field__hint">
            References, sketches, or the spot it&rsquo;s going. Up to{" "}
            {MAX_PHOTOS}; we shrink big ones for&nbsp;you.
          </p>
          {enhanced && (
            <div className="photo-picker">
              {photos.length > 0 && (
                <ul className="photo-picker__list">
                  {photos.map((photo, index) => (
                    <li key={photo.url} className="photo-picker__item">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a local preview (blob URL), not a site image */}
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}: ${photo.file.name}`}
                        className="image-cover"
                      />
                      <IconButton
                        icon="close"
                        label={`Remove photo ${index + 1}`}
                        size="sm"
                        variant="secondary"
                        className="photo-picker__remove"
                        onClick={() => removePhoto(index)}
                      />
                    </li>
                  ))}
                </ul>
              )}
              {photos.length < MAX_PHOTOS && (
                <label className="button button--secondary photo-picker__add">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="visually-hidden"
                    aria-describedby="request-photos-hint"
                    onChange={(event) => {
                      const files = Array.from(event.currentTarget.files ?? []);
                      event.currentTarget.value = "";
                      void addPhotos(files);
                    }}
                  />
                  <Icon name="plus" className="button__icon" />
                  {preparing
                    ? "Preparing photos…"
                    : photos.length > 0
                      ? "Add another photo"
                      : "Add photos"}
                </label>
              )}
            </div>
          )}
          {/* The fields Netlify reads. Plain file inputs until scripts
              run; after that they're hidden and the picker fills them. */}
          {Array.from({ length: MAX_PHOTOS }, (_, index) => (
            <input
              key={index}
              ref={(input) => {
                slots.current[index] = input;
              }}
              type="file"
              name={`reference-${index + 1}`}
              accept="image/*"
              aria-label={`Photo ${index + 1}`}
              aria-describedby="request-photos-hint"
              className="field__control"
              hidden={enhanced}
            />
          ))}
        </fieldset>

        {defaultArtist && (
          <div className="request-form__tattoo-only">{artistField}</div>
        )}

        <details className="request-form__more request-form__tattoo-only">
          <summary className="request-form__more-summary">
            <span className="request-form__more-title">
              <span className="request-form__more-label">
                Add details (optional)
              </span>
              <span className="small muted">
                Size, placement, color{defaultArtist ? "" : ", artist"}, budget,
                timing
              </span>
            </span>
            <Icon name="plus" className="request-form__more-icon" />
          </summary>
          <div className="request-form__more-body">
            <fieldset className="fieldset">
              <legend className="field__label">Size</legend>
              <ChoiceChips name="size" options={sizes} />
              <p className="field__hint">
                Small is palm-sized or less, medium about a hand, large a
                forearm or calf, bigger a half sleeve and&nbsp;up.
              </p>
            </fieldset>
            <div className="request-form__row">
              <Field
                id="request-placement"
                label="Placement"
                hint="e.g. inner left forearm."
              >
                {(control) => (
                  <input {...control} name="placement" type="text" />
                )}
              </Field>
              <fieldset className="fieldset">
                <legend className="field__label">Color</legend>
                <ChoiceChips name="color" options={colors} />
              </fieldset>
            </div>
            <label className="check">
              <input type="checkbox" name="cover-up" value="yes" />
              <span>It covers up or reworks an existing tattoo</span>
            </label>
            <div className="request-form__row">
              {!defaultArtist && artistField}
              <Field
                id="request-budget"
                label="Budget"
                hint="What you’re hoping to spend. We’ll say what’s realistic."
              >
                {(control) => <input {...control} name="budget" type="text" />}
              </Field>
            </div>
            <fieldset className="fieldset">
              <legend className="field__label">When works for you?</legend>
              <ChoiceChips name="availability" options={timings} />
            </fieldset>
          </div>
        </details>
      </section>

      <section aria-labelledby="request-you" className="request-form__section">
        <h2 id="request-you" className="heading-4">
          How to reach you
        </h2>
        <div className="request-form__row">
          <Field id="request-name" label="Name" error={errors.name}>
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
          <Field id="request-email" label="Email" error={errors.email}>
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
        </div>
        <fieldset className="fieldset">
          <legend className="field__label">How should we reply?</legend>
          <ChoiceChips
            name="contact-method"
            options={["Email me", "Text me"]}
            defaultValue="Email me"
          />
        </fieldset>
        <div className="request-form__text-only">
          <Field
            id="request-phone"
            label="Phone number"
            hint="The number we should text back."
            error={errors.phone}
          >
            {(control) => (
              <input {...control} name="phone" type="tel" autoComplete="tel" />
            )}
          </Field>
        </div>
      </section>

      {status.state === "error" && (
        <p role="alert" className="form-status">
          <strong>Something went wrong.</strong> {status.message}
        </p>
      )}

      <div className="request-form__submit">
        <h2 className="heading-4">What happens next</h2>
        <ol className="request-steps">
          <li>Send this. It doesn&rsquo;t book anything&nbsp;yet.</li>
          <li>
            We reply to set up a free consultation: design, size and price.
          </li>
          {depositAmount ? (
            <li>A ${depositAmount} deposit holds your appointment.</li>
          ) : null}
        </ol>
        {status.state === "invalid" && (
          // Seen as well as heard (the live region below speaks it): Send is
          // at the bottom and focus has jumped to the first problem.
          <p aria-hidden="true" className="request-form__status">
            {announcement} They&rsquo;re marked above.
          </p>
        )}
        <Button
          type="submit"
          icon="arrow-right"
          pending={status.state === "sending" || preparing}
        >
          {status.state === "sending" ? "Sending…" : "Send request"}
        </Button>
      </div>
      <p role="status" className="visually-hidden">
        {announcement}
      </p>
    </form>
  );
}
