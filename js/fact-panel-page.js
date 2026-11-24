// fact-panel-page.js: the page button OUTSIDE <fact-panel> that toggles
// the component's compact attribute.

const factPanel = document.querySelector("fact-panel");
const compactButton = document.querySelector("#fact-compact-toggle");

// Keeps the button's label matching the panel's current state.
function updateCompactButton() {
    if (factPanel.hasAttribute("compact")) {
        compactButton.textContent = "Show details";
    } else {
        compactButton.textContent = "Hide details";
    }
}

if (factPanel && compactButton) {
    compactButton.addEventListener("click", () => {
        factPanel.toggleAttribute("compact"); // the component reacts to this
        updateCompactButton();
    });

    updateCompactButton();
    compactButton.hidden = false; // only show the button when JS can run it
}
