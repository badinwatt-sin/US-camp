# US Camp — Classic Canvas. Modern Wild.

Landing page / web app for **US Camp**, a Thai shop for Springbar®-style American canvas tents.
Static site: plain HTML, CSS and JavaScript. No build step.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Sections

| # | Section | What it does |
|---|---------|--------------|
| — | Intro | A spring-bar arc draws in, then the US CAMP wordmark rises and the screen wipes up like a film title card (plays once per session) |
| — | Hero | Full-bleed real photography in a slow Ken Burns crossfade, with captions and a facts strip (1961 · $83 · 6.5 ft · SLC) |
| 1 | **A Masterpiece of Simplicity** | The real Springbar history (1944 → 1961 → the frame → today) with archive and workshop photos, a row of craft details and a panorama band |
| 2 | **A Day Under Canvas** | First Light / High Noon / Golden Hour / Lantern Light: the sky gradient, a real photo, the story and the senses change together and auto-advance. Ends with a strip of credited community photos |
| 3 | **The Tents (360° Studio)** | Three.js models of the four real Springbar tents (Compact, Outfitter, Vagabond, Traveler) built from the official product photos and field-guide outlines, in the five real colourways. Switch to the official front and rear product photos |
| 4 | **Build Your Camp** | Five-step configurator (setting → tent → shelter → living → time of day). The preview is a photo lookbook: a real campsite photo for the setting and time, the chosen tent's real product photo, and the selected gear. Generates a camp name, style tags, a Camp Card and a share link, and can send the camp to an advisor |
| 5 | **นัดลองกางเต้นท์ (try-out booking)** | Booking form for a showroom visit, filled in from the Camp Card |

## Shop · checkout · tracking · admin (demo)

> **Demo only.** Prices are simulated (THB, roughly from springbar.com USD list prices) and must be confirmed.
> No payment is processed, nothing is sent to a server, and no card number is stored (brand + last 4 only).
> Orders live in the visitor's browser (`localStorage`), so the admin page only sees orders made in the same browser.

| Page | What it does |
|---|---|
| `shop.html` | Catalogue (4 tents × 5 colours + 10 accessories), category tabs, sort, product dialog with colour/size options, cart drawer |
| `checkout.html` | 3 steps: delivery (pick up at store with date + time, or address with standard/express, express limited to Bangkok metro) → payment (card / PromptPay QR / bank transfer) → review. Card runs a simulated 3-D Secure OTP (`123456`); PromptPay shows a sample QR with a 15-minute timer; transfer shows bank accounts and takes a slip upload |
| `track.html` | Customer looks up an order by order number + last 4 digits of phone: progress bar, carrier + tracking number, timeline, upload a slip later |
| `admin.html` | Back office (demo passcode `demo`): KPIs, filters, search, order drawer to verify slips, mark paid/refund, update status with carrier + tracking number, notify customer (simulated), seed sample orders, wipe demo data |

Order lifecycle: payment `pending → awaiting_verification → paid` (or `failed` / `refunded`);
delivery `placed → confirmed → packing → shipped → out_for_delivery → delivered`;
pickup `placed → confirmed → packing → ready_for_pickup → picked_up`; any → `cancelled`.

**To go live** you need a backend and real providers, for example:
a database + server-side admin login for orders; a Thai payment gateway that supports cards and PromptPay (e.g. Omise/Opn, 2C2P, GB Prime Pay or Stripe Thailand) with webhooks to mark orders paid;
a slip-verification service or manual check for bank transfers; SMS/LINE OA messages for status updates; and carrier tracking links or APIs.

## Files

```
index.html
css/style.css      design tokens (tent-derived palette), layout, motion
js/data.js         models, colours, terrains, gear, presets  ← edit catalogue here
js/main.js         intro, nav, reveals, parallax, story, day-at-camp, form
js/tent360.js      Three.js 360° studio
js/build.js        Build Your Camp configurator
assets/img/real/        lifestyle and craft photography (Springbar® and credited community photos)
assets/img/products/    official Springbar® product photos, per model × colour + rear view
shop.html, checkout.html, track.html, admin.html   demo commerce pages
css/shop.css            commerce styles
js/shop/catalog.js      products + simulated prices          ← edit prices here
js/shop/store.js        cart, orders, statuses, shipping rates, validation (localStorage)
js/shop/ui.js           cart drawer, cart badge, toasts
js/shop/{shop,checkout,track,admin,home}.js   page logic
js/thai-wrap.js         keeps Thai words whole when lines wrap
assets/img/shop/        accessory product photos (Springbar®)
```

## Before launch

- Specs in `js/data.js` come from springbar.com (Nov 2026). Check them again before launch.
- Get written permission from Springbar for the product photography, and from each credited community photographer (@dellpickles, @jorduroy, @bloodknots, @twora-camp, @allaboutoutdoor_official), before commercial use.
- Replace the placeholder contact details in the footer (LINE @uscamp, hello@uscamp.co, showroom address).
- Connect the try-out booking form to a backend, LINE OA or a form service. It only validates in the browser right now.
- Some community photos are small (about 380–790 px wide). Ask for the originals.
- Confirm the dealer relationship and trademark wording with Springbar.
