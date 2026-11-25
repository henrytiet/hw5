// fact-panel-page.js: the page button OUTSIDE <fact-panel> that toggles
// the component's compact attribute, plus the saved preference (Part 3).

const MODE_KEY = "hw5-fact-panel-mode";
const DEFAULT_MODE = "compact";

const factPanel = document.querySelector("fact-panel");
const compactButton = document.querySelector("#fact-compact-toggle");

// Reads the saved mode. A missing or unknown value, or a storage error,
// gives the default instead.
function readMode() {
    try {
        const saved = localStorage.getItem(MODE_KEY);
        if (saved === "compact" || saved === "expanded") {
            return saved;
        }
    } catch (error) {
        console.warn("The fact panel preference could not be read.", error);
    }
    return DEFAULT_MODE;
}

// Saves the mode. If this fails, the change has already been applied,
// so it still works for the current page.
function saveMode(mode) {
    try {
        localStorage.setItem(MODE_KEY, mode);
    } catch (error) {
        console.warn("The fact panel preference could not be saved.", error);
    }
}

// One path for both the button and the restored preference: set or remove
// the observed attribute, then make the button's label match.
function applyMode(mode) {
    factPanel.toggleAttribute("compact", mode === "compact");

    if (factPanel.hasAttribute("compact")) {
        compactButton.textContent = "Show details";
    } else {
        compactButton.textContent = "Hide details";
    }
}

if (factPanel && compactButton) {
    // On page load: restore the saved choice (or the default).
    applyMode(readMode());

    compactButton.addEventListener("click", () => {
        let nextMode = "compact";
        if (factPanel.hasAttribute("compact")) {
            nextMode = "expanded";
        }
        applyMode(nextMode); // apply first...
        saveMode(nextMode);  // ...then try to save
    });

    compactButton.hidden = false; // only show the button when JS can run it
}
