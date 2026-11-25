// fact-panel.js: the <fact-panel> Web Component (HW5).

// Part 2: the API endpoint for one random English fact.
const FACT_URL = "https://uselessfacts.jsph.pl/api/v2/facts/random?language=en";

// Piece 1: local sample data.
// Each fact uses the same field names as the Useless Facts API
// (text, source, permalink), so live facts can join this list later.
const SAMPLE_FACTS = [
    {
        text: "Climbing is much easier when you use your feet!",
        source: "Henry's climbing notes",
        permalink: null
    },
    {
        text: "Bouldering grades use the V scale, named after climber John \"Vermin\" Sherman.",
        source: "Henry's climbing notes",
        permalink: null
    }
];

// Piece 2: the class that defines how <fact-panel> behaves.
class FactPanel extends HTMLElement {
    constructor() {
        super(); // set up the HTMLElement part first (required)

        // State: the facts this panel knows about, and which one is showing.
        this.facts = [...SAMPLE_FACTS]; // a copy, so the samples never change
        this.index = 0;                 // start on the first fact
        this.loading = false;           // Part 2: true while a request is pending
    }

    // Piece 3: build the interface when the element is added to the page.
    connectedCallback() {
        // Part 3: remove the no-JavaScript fallback written in the HTML.
        this.replaceChildren();

        // Heading
        const heading = document.createElement("h2");
        heading.id = "fact-panel-heading"; // the page's <section> points to this
        heading.textContent = "Random Fact";

        // Where the current fact's text goes
        this.factText = document.createElement("p");
        this.factText.className = "fact-text";

        // Extra details (hidden in compact mode): source and permalink
        this.details = document.createElement("div");
        this.details.className = "fact-details";

        this.source = document.createElement("p");
        this.permalink = document.createElement("a");
        this.permalink.textContent = "View this fact";

        this.details.appendChild(this.source);
        this.details.appendChild(this.permalink);

        // Previous / Next buttons
        this.prevButton = document.createElement("button");
        this.prevButton.type = "button";
        this.prevButton.textContent = "Previous fact";

        this.nextButton = document.createElement("button");
        this.nextButton.type = "button";
        this.nextButton.textContent = "Next fact";

        // Part 2: button that requests a live fact from the API
        this.loadButton = document.createElement("button");
        this.loadButton.type = "button";
        this.loadButton.textContent = "Get a random fact";

        // Status message, announced by screen readers when it changes
        this.status = document.createElement("p");
        this.status.setAttribute("role", "status");

        // Put everything inside <fact-panel>, in reading order
        this.appendChild(heading);
        this.appendChild(this.factText);
        this.appendChild(this.details);
        this.appendChild(this.prevButton);
        this.appendChild(this.nextButton);
        this.appendChild(this.loadButton);
        this.appendChild(this.status);

        // Piece 4: make the buttons work, then show the first fact.
        this.prevButton.addEventListener("click", () => this.step(-1));
        this.nextButton.addEventListener("click", () => this.step(1));
        this.loadButton.addEventListener("click", () => this.loadFact());

        this.showFact(0);
        this.applyCompact(); // in case compact was already set in the HTML

        this.loadFact(); // Part 2: load one live fact when the page opens
    }

    // Piece 5: watch the compact attribute.
    static get observedAttributes() {
        return ["compact"];
    }

    // Runs whenever a watched attribute is added, removed, or changed.
    attributeChangedCallback(name) {
        // This can run before connectedCallback (if compact is in the HTML),
        // when this.details doesn't exist yet. Skip until the panel is built.
        if (name === "compact" && this.details) {
            this.applyCompact();
        }
    }

    // Hides the details in compact mode and shows them otherwise.
    applyCompact() {
        this.details.hidden = this.hasAttribute("compact");
    }

    // Moves forward (+1) or back (-1), wrapping around at either end.
    step(direction) {
        const count = this.facts.length;
        const newIndex = (this.index + direction + count) % count;
        this.showFact(newIndex);
    }

    // Puts the fact at position i on screen and updates the status.
    // `message` is optional extra text before "Fact x of y".
    showFact(i, message = "") {
        this.index = i;
        const fact = this.facts[i];

        this.factText.textContent = fact.text;
        this.source.textContent = `Source: ${fact.source}`;

        // Only show the link when the fact has one (samples don't).
        if (fact.permalink) {
            this.permalink.href = fact.permalink;
            this.permalink.hidden = false;
        } else {
            this.permalink.removeAttribute("href");
            this.permalink.hidden = true;
        }

        this.setStatus(`${message}Fact ${i + 1} of ${this.facts.length}`, "ok");
    }

    // Writes a status message. `state` ("ok", "loading", or "error") is saved
    // as data-state so the CSS can style errors differently in Part 3.
    setStatus(message, state) {
        this.status.textContent = message;
        this.status.dataset.state = state;
    }

    // ===== Part 2: request a fact from the API =====
    async loadFact() {
        // Ignore extra clicks while a request is already pending.
        if (this.loading) {
            return;
        }
        this.loading = true;
        this.setStatus("Loading a random fact…", "loading");

        try {
            const response = await fetch(FACT_URL, {
                headers: { Accept: "application/json" }
            });

            // An HTTP error like 404 or 500 still gives a response, so check it.
            if (!response.ok) {
                throw new Error(`The server answered with HTTP status ${response.status}.`);
            }

            const data = await response.json(); // throws SyntaxError on bad JSON
            const fact = this.checkFact(data);  // throws if fields are wrong

            // Success: add the fact to the end of the list and show it.
            this.facts.push(fact);
            this.showFact(this.facts.length - 1, "New fact loaded. ");
            this.loadButton.textContent = "Get a random fact";
        } catch (error) {
            console.error("Could not load a fact.", error);

            // Pick a message for the kind of failure.
            let reason = error.message;
            if (error instanceof TypeError) {
                reason = "The network request failed. Check your connection.";
            } else if (error instanceof SyntaxError) {
                reason = "The response was not valid JSON.";
            }

            // The fact on screen stays the same, so the panel still works.
            this.setStatus(`Could not load a new fact. ${reason} Press Try again to retry.`, "error");
            this.loadButton.textContent = "Try again";
        } finally {
            // Runs after success OR failure: allow the next request.
            this.loading = false;
        }
    }

    // Checks the fields this component uses and returns a clean fact object.
    // Throws an Error if the response can't be used.
    checkFact(data) {
        // ?. avoids a crash if data is null
        if (typeof data?.text !== "string" || data.text.trim() === "") {
            throw new Error("The response did not include any fact text.");
        }

        let source = "unknown";
        if (typeof data.source === "string" && data.source.trim() !== "") {
            source = data.source.trim();
        }

        // Only keep the permalink if it is a real https:// URL.
        let permalink = null;
        if (typeof data.permalink === "string") {
            try {
                const url = new URL(data.permalink);
                if (url.protocol === "https:") {
                    permalink = url.href;
                }
            } catch {
                // Not a valid URL: leave permalink as null (link stays hidden).
            }
        }

        return {
            // The API sometimes uses ` as an apostrophe; swap it for '
            text: data.text.trim().replaceAll("`", "'"),
            source: source,
            permalink: permalink
        };
    }
}

// Piece 6: tell the browser that <fact-panel> uses the FactPanel class.
customElements.define("fact-panel", FactPanel);
