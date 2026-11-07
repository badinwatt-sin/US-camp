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
```

## Before launch

- Specs in `js/data.js` come from springbar.com (Nov 2026). Check them again before launch.
- Get written permission from Springbar for the product photography, and from each credited community photographer (@dellpickles, @jorduroy, @bloodknots, @twora-camp, @allaboutoutdoor_official), before commercial use.
- Replace the placeholder contact details in the footer (LINE @uscamp, hello@uscamp.co, showroom address).
- Connect the try-out booking form to a backend, LINE OA or a form service. It only validates in the browser right now.
- Some community photos are small (about 380–790 px wide). Ask for the originals.
- Confirm the dealer relationship and trademark wording with Springbar.
