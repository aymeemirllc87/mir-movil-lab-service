# Mir Movil Lab Service

Client website for **Mir Movil Lab Service**, a mobile phlebotomy and laboratory
specimen collection service operating in Miami-Dade and Broward County, Florida.

Built for *Introduction to Web Development* by **Aymee Mir**.

## Pages

| File | Purpose |
|---|---|
| `index.html` | Home. Hero, ZIP coverage checker, reasons to choose the service. |
| `services.html` | Six services with prices, specimen figure, request builder. |
| `about.html` | Founder story, audio welcome message with transcript, core values. |
| `contact.html` | Appointment request form with validation and contact details. |

## Structure

```
.
├── index.html
├── services.html
├── about.html
├── contact.html
├── css/
│   └── style.css        mobile-first, Flexbox, breakpoints at 720px and 1080px
├── js/
│   └── main.js          coverage checker, request builder, form validation
├── images/
│   ├── logo.svg
│   ├── hero-mobile.jpg  / hero-tablet.jpg / hero-desktop.jpg
│   ├── specimen-collection.jpg
│   └── home-care.jpg
└── media/
    └── welcome-message.wav   spoken welcome message, 34 s
```

## Design system

**Colours (4)**

| Token | Hex | Used for |
|---|---|---|
| `--brand` | `#0F6E62` | header rule, buttons, footer, headings accent |
| `--brand-tint` | `#E4F1EE` | secondary panels, cards, service tags |
| `--ink` | `#22312E` | body text |
| `--white` | `#FFFFFF` | page background |

`--error` (`#C0392B`) sits deliberately outside the palette and appears in one
place only: form validation errors.

**Typography (2 families)** — Poppins for headings, navigation and buttons;
Inter for body copy, labels and form controls.

**Responsive** — written mobile-first. The base rules are the phone layout; two
media queries add the wider ones.

- Below 720px: navigation is a vertical list of full-width buttons, service
  cards run one per row.
- 720px and up: navigation becomes one horizontal row, cards two per row.
- 1080px and up: cards three per row, the hero and the contact page split into
  two columns.

## JavaScript features

1. **Coverage checker** (`index.html`) — a visitor enters a five digit ZIP code;
   `findZoneByZip()` searches the `SERVICE_ZONES` array and the page reports the
   zone, the travel fee and the expected scheduling window without reloading.

2. **Service request builder** (`services.html`) — `toggleService()` adds or
   removes a service, `renderQuote()` rebuilds the summary list and totals the
   price and on-site minutes from the `SERVICES` array. The selection is written
   to `localStorage`, so it survives closing the browser.

3. **Appointment form** (`contact.html`) — `validateForm()` runs six checks and
   `event.preventDefault()` blocks submission until all of them pass. Each error
   message is written into a `<span>` directly below its own field and nothing
   the visitor already typed is cleared. On success the inquiry is saved to
   `localStorage`; `restoreInquiry()` reads it back on the next visit along with
   anything picked on the Services page.

Data lives in two arrays (`SERVICES`, `SERVICE_ZONES`) and one configuration
object (`STORAGE_KEYS`) that holds both storage key names in one place.

## Accessibility

- Every form control is bound to its own `<label>` through matching `for` / `id`.
- All images carry descriptive `alt` text.
- The coverage result, the request summary and the form status are live regions
  (`role="status"`, `aria-live="polite"`), so a screen reader is told when the
  page changes.
- A skip link lets keyboard users jump past the navigation.
- The audio element has fallback text, a download link and a full written
  transcript.
- Every page declares `lang="en"`; charcoal text on white gives strong contrast.

## Running locally

Open `index.html` directly, or serve the folder so `localStorage` behaves the
same way it will in production:

```bash
python -m http.server 8000
```

Then visit <http://127.0.0.1:8000>.
