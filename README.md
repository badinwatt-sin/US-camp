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
| — | Hero | Vintage-poster desert scene drawn in SVG, with mouse and scroll parallax, a flickering campfire, a rotating badge and a marquee |
| 1 | **The Long Way Home** | Sticky story chapters (1961 → Spring Bar → Canvas → Legacy). Photos wipe in and go from sepia to colour; the spring-bar diagram draws itself |
| 2 | **A Day at Camp** | Dawn / Noon / Golden Hour / Fireside: the sky gradient, postcard photo, story and senses change together and auto-advance. Ends with a strip of field-journal polaroids |
| 3 | **360° Tent Studio** | Three.js tent you can drag 360° and zoom: 4 models, 4 canvas colours, awning and door toggles, hotspots that explain each feature |
| 4 | **Build Your Camp** | Five-step configurator (setting → tent → shelter → living → mood). A live illustrated scene, a generated camp name, style tags, a Camp Card, a share link (`#camp=…`) and a button that sends the camp to an advisor |
| 5 | **Pitch Day** | Booking form for a showroom visit, filled in from the Camp Card |

## Files

```
index.html
css/style.css      design tokens (tent-derived palette), layout, motion
js/data.js         models, colours, terrains, gear, presets  ← edit catalogue here
js/tent-svg.js     reusable illustrated tent (hero and configurator)
js/main.js         intro, nav, reveals, parallax, story, day-at-camp, form
js/tent360.js      Three.js 360° studio
js/build.js        Build Your Camp configurator
assets/img/        photography
```

## Before launch

- Confirm the tent specs in `js/data.js` (sizes and capacity are illustrative) and which colourways are available.
- Replace the placeholder contact details in the footer (LINE @uscamp, hello@uscamp.co, showroom address).
- Connect the Pitch Day form to a backend, LINE OA or a form service. It only validates in the browser right now.
- Use licensed, high-resolution photography. The current photos are reference images about 550 px wide.
- Confirm the dealer relationship and trademark wording with Springbar.
