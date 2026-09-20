"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type Artist = { slug: string; name: string };

/**
 * Netlify Forms contact form. With the Next runtime the page isn't static HTML,
 * so Netlify detects the form from public/__forms.html and this posts there.
 * Without JavaScript the plain HTML POST still works: Netlify redirects to
 * /contact/thanks. Keep field names in sync with public/__forms.html.
 */
export function ContactForm({ artists }: { artists: readonly Artist[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("sending");

    const params = new URLSearchParams();
    for (const [key, value] of new FormData(event.currentTarget)) {
      if (typeof value === "string") params.append(key, value);
    }

    try {
      const response = await fetch("/__forms.html", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
      });
      if (!response.ok) throw new Error(`Form post failed: ${response.status}`);
      router.push("/contact/thanks");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      name="contact"
      method="post"
      action="/__forms.html"
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
        <label htmlFor="contact-artist" className="field__label">
          Artist (optional)
        </label>
        <select id="contact-artist" name="artist" className="field__control">
          <option value="">No preference</option>
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

      <p className="small muted">Name, email and message are required.</p>

      {status === "error" && (
        <p role="alert" className="form-status">
          <strong>We couldn&rsquo;t send your message.</strong> Please try again
          in a moment.
        </p>
      )}

      <div>
        <Button type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending…" : "Send message"}
        </Button>
      </div>
    </form>
  );
}
