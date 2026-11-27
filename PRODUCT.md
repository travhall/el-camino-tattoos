# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three visitors matter equally; none is secondary:

- **First-timer.** A local who has never been tattooed, or never been to this shop. Needs to trust the shop, understand how getting tattooed here works (consult, deposit, session), and feel welcome before reaching out.
- **Tattooed local.** Already has work and knows the drill. Compares shops and chooses an artist by their portfolio.
- **Walk-in, right now.** Downtown on a phone, wants to know whether they can come in today, where the shop is, and how to call.

## Product Purpose

The website for El Camino Tattoo, a small tattoo shop in downtown Eau Claire, Wisconsin. It shows the artists and their work, explains how the shop operates, and collects appointment requests.

**Success is a sent appointment request** through the site's form, which goes to one shared shop inbox. Calls and walk-ins are welcome outcomes, but the request is the measure.

## Positioning

An approachable, unpretentious, working-class American traditional shop downtown. It is welcoming, not exclusive. Walk-ins are welcome when an artist is available (and actively wanted right now), consultations are free, and prices are "industry standard, maybe a bit low". The shop will work within a client's budget and say what's realistic. Mainly American traditional, but the artists work in other styles too (fine line, illustrative, black and grey).

## Operating Context

- **Booking.** Each artist books their own appointments. The site is a single shared inbox and never routes requests per artist. Callers with no artist preference are matched by availability and judgment.
- **Request flow.** The visitor sends an idea through the form (optionally with reference images, placement, size and budget). An artist replies. A deposit (usually $100) holds the appointment. Then the session.
- **Pricing.** Never publish tattoo prices. Artists usually charge hourly but may quote a flat rate per piece. The $100 deposit is a booking fee, not tattoo pricing, and may be mentioned in passing. Full policy text lives in the FAQ.
- **People.** The roster is resident artists, one apprentice (Taylor, likely through spring or summer 2027), and occasional guest or traveling artists. No new residents or apprentices will be taken on.
- **Content editing.** Shop details, each page (its hero, plus the home page's promises and artists section), artists and pieces are edited in Keystatic (`/keystatic`) by non-developers. FAQ and Aftercare are just a hero for now.

## Capabilities and Constraints

- Next.js App Router, React, Tailwind CSS v4, TypeScript, Keystatic (files in the repo), hosted on Netlify. Use pnpm only.
- **Contact form.** Uses Netlify Forms with up to 3 file uploads (8MB per submission), a honeypot, and a no-JavaScript fallback.
- **Pages.** Artists (resident and guest), portfolio with an artist filter, piece pages plus an intercepting-route lightbox, contact, FAQ, Aftercare, and a styleguide.
- **Primary action label.** "Request an appointment". The form requests an appointment; it does not confirm a booking. A real "Book" flow for existing clients is a later phase and needs a scheduling tool; don't add a Book link before then.
- **Undecided (waiting on the owner):**
  - Exact deposit and cancellation policy.
  - Response-time promise and walk-in hours.
  - Minimum age or ID rule.
  - The style taxonomy.
  - Whether the apprentice is labeled.
  - How guest artists are announced.
  - The real address, phone, email, hours and Instagram.
  - The real logo.

## Brand Commitments

- **Name.** El Camino Tattoo. The sister business is El Camino Skate Shop (elcaminoskateshop.com), for reference only.
- **Idiom.** The owner has committed to the American traditional tattoo idiom, holding both "refined and classic" and "fun and punk". His references are Memorial Brooklyn and Decoraters Tattoo, Chicago.
- **Real text.** All text stays real HTML text and is never baked into images.
- **Not generic.** The site must not look generic or AI-generated.
- **Voice.** Plain, friendly, unpretentious. The owner's own wording is informal.

## Evidence on Hand

- **Placeholders.** Everything visible is placeholder: copy, artist names (Ty Morse and two unnamed artists), photos (Unsplash), and the address. `content/shop/contact.yaml` currently holds the sister skate shop's address, and it must never ship as the tattoo shop's address.
- **No real proof yet.** No real testimonials, reviews, press or photography exist. Don't fabricate any.
- **Logo.** `public/logo.svg` is a placeholder wordmark until the real logo arrives.

## Product Principles

1. **Welcome first.** Every page should make a nervous first-timer feel they belong. Approachability beats exclusivity.
2. **The work is the proof.** Real tattoos by real artists carry the trust; claims don't.
3. **One clear way in.** Every path leads to "Request an appointment", with walk-ins and the phone always close at hand.
4. **Honest about how it works.** Explain the process (consult, deposit, session) at the moment of decision. Never publish prices.
5. **Editable by the shop.** Anything the owner may change lives in Keystatic, not in code.

## Accessibility & Inclusion

WCAG 2.2 AA is the floor, enforced by `pnpm test` (axe on every route, light and dark, phone and desktop) and by `pnpm check:contrast`. Standalone targets are at least 44px. State is never shown by color alone. Motion honors `prefers-reduced-motion`. Any auto-moving element needs a pause control.
