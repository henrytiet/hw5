## Links

Repository:  https://github.com/henrytiet/hw5

Website:  https://henryhw5.netlify.app/ 

Component Page URL: https://henryhw5.netlify.app/

## SSG Exercise

Path: ssg-exercise/

Pages to review: Home (src/index.njk) and Resume (src/resume.njk)

Reference ssg-exercise/README.md for instructions on setup


## Design Note

### What the visitor wants

The `<fact-panel>` at the bottom of the home page is a little easter egg after scrolling down the climbing wall. The visitor will want to read random facts, and be able to go back to older ones. They can also find more details about the source of where the fact came from if they are so inclined.

### Tracing one action: pressing "Get a random fact"

1. **Control.** The "Get a random fact" button inside the component has a click listener (added in `connectedCallback()` in `js/fact-panel.js`) that calls `loadFact()`.
2. **Before the request.** If a request is already running, `loadFact()` returns and the extra click does nothing. Otherwise it sets `this.loading = true` and writes "Loading a random fact…" into the status paragraph. That paragraph has `role="status"`, so screen readers announce it.
3. **API request.** `fetch()` sends a GET request to `https://uselessfacts.jsph.pl/api/v2/facts/random?language=en` with an `Accept: application/json` header.
4. **Checking the response.**
   - If `response.ok` is false (for example 404 or 500), an error is thrown with the HTTP status.
   - `response.json()` parses the body, and throws if it isn't valid JSON.
   - `checkFact()` then checks the fields the component uses: `text` must be a non-empty string, `source` falls back to "unknown", and `permalink` is kept only if it is a valid `https:` URL.
5. **DOM update.** The checked fact is pushed onto `this.facts`, and `showFact()` displays it:
   - The fact text goes into the fact paragraph and the source into the details area, using `textContent`, so remote text is never treated as HTML.
   - The "View this fact" link gets the permalink.
   - The status changes to "New fact loaded. Fact 3 of 3".
6. **Cleanup.** A `finally` block sets `this.loading = false`, whether the request succeeded or failed, so the button works again.

### What the visitor sees

- **While waiting:** the status line reads "Loading a random fact…" in italics. The current fact stays on screen, and the rest of the page keeps working.
- **On success:** the new fact appears with its source and link (unless the panel is in compact mode), and the status shows its position, for example "Fact 3 of 3." Previous and Next move through every fact loaded so far, including the two local sample facts.
- **If the request fails** (offline, an HTTP error, invalid JSON, or missing fields):
  - The status line turns bold and red with a message saying what went wrong, for example "Could not load a new fact. The network request failed. Check your connection. Press Try again to retry."
  - The button's label changes to **Try again**, and the facts already loaded stay on screen.
  - When a retry succeeds, the error message is replaced and the label goes back to "Get a random fact", without reloading the page.

### Other behavior

- **Compact mode:** the "Show details / Hide details" button outside the component toggles its observed `compact` attribute. `attributeChangedCallback()` hides or shows the source and link, and the current fact stays selected.
- **Saved preference:** the choice is saved in `localStorage` under `hw5-fact-panel-mode` and restored on reload. The default is compact, which is used if nothing is saved, the value is unrecognized, or storage can't be read.
- **Theme:** the component's colors come from `--fact-panel-*` custom properties with fallbacks (in `fact-panel.css`). `index.css` sets them from the site's theme variables, so the panel follows the light and dark themes.
- **Without JavaScript:** the panel shows its heading and the message "Enable JavaScript to load live data for this widget." The rest of the portfolio works normally.
