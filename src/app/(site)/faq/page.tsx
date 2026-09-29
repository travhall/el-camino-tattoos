import type { Metadata } from "next";
import Link from "next/link";
import { RichText, richTextToPlainText } from "@/components/rich-text";
import { getFaqs } from "@/lib/content";
import { pageMetadata } from "@/lib/seo";
import { siteName } from "@/lib/site";

export const metadata: Metadata = pageMetadata({
  title: "FAQ",
  description: `Answers to common questions about getting tattooed at ${siteName}.`,
  path: "/faq",
});

export default async function FaqPage() {
  const faqs = await getFaqs();

  const faqJsonLd =
    faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: richTextToPlainText(faq.answer),
            },
          })),
        }
      : null;

  return (
    <>
      <div className="stack">
        <h1>FAQ</h1>
        {faqs.length === 0 ? (
          <p className="muted measure">
            No questions have been added yet. If you have one, please{" "}
            <Link href="/contact" className="link">
              get in touch
            </Link>
            .
          </p>
        ) : (
          <div className="faq">
            {/* The id makes each question linkable: /faq#deposit. */}
            {faqs.map((faq) => (
              <section
                key={faq.slug}
                id={faq.slug}
                aria-labelledby={`${faq.slug}-question`}
                className="faq__item"
              >
                <h2 id={`${faq.slug}-question`} className="heading-3">
                  {faq.question}
                </h2>
                <RichText node={faq.answer} />
              </section>
            ))}
          </div>
        )}
      </div>
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </>
  );
}
