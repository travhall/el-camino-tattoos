import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Message sent",
  robots: { index: false },
};

export default function ThanksPage() {
  return (
    <div className="status-page">
      <p className="eyebrow">Message sent</p>
      <h1>Thanks for reaching out</h1>
      <p className="lead muted">
        Your message is on its way, and we&rsquo;ll get back to you soon.
      </p>
      <div className="cluster">
        <ButtonLink href="/portfolio">View the portfolio</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Home
        </ButtonLink>
      </div>
    </div>
  );
}
