/*
  theme.js: light/dark theme switch with a saved preference.

  Loaded in <head> WITHOUT defer on purpose: the saved theme is applied before
  the page is drawn, so a dark-theme visitor never sees a flash of the light
  theme. The button itself is set up later, once the page has been parsed.

  Without JavaScript the page simply stays in the default light theme and the
  button stays hidden.
*/

const THEME_KEY = "theme";
const DEFAULT_THEME = "light";

// Reads the saved theme. Storage can be blocked, so failures fall back to the default.
function readSavedTheme() {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        if (saved === "light" || saved === "dark") {
            return saved;
        }
    } catch (error) {
        console.warn("The saved theme could not be read.");
    }
    return DEFAULT_THEME;
}

// Saves the theme. If this fails, the theme still applies to the current page.
function saveTheme(theme) {
    try {
        localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
        console.warn("The theme preference could not be saved.");
    }
}

let currentTheme = readSavedTheme();
let themeButton = null;

// Applies a theme to the page. The CSS reads the data-theme attribute on <html>.
function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.setAttribute("data-theme", theme);

    // The button's text says what pressing it will do.
    if (themeButton) {
        if (theme === "dark") {
            themeButton.textContent = "Switch to light theme";
        } else {
            themeButton.textContent = "Switch to dark theme";
        }
    }
}

function switchTheme() {
    let nextTheme = "dark";
    if (currentTheme === "dark") {
        nextTheme = "light";
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Use a view transition (a cross-fade between the two themes) when the
    // browser supports it and the person has not asked for reduced motion.
    // Otherwise the theme just changes instantly.
    if (document.startViewTransition && !prefersReducedMotion) {
        document.startViewTransition(function () {
            applyTheme(nextTheme);
        });
    } else {
        applyTheme(nextTheme);
    }

    saveTheme(nextTheme);
}

// Apply the saved theme right away, before the page is drawn.
applyTheme(currentTheme);

// Once the page is parsed, reveal the button and make it work.
document.addEventListener("DOMContentLoaded", function () {
    themeButton = document.querySelector("#theme-toggle");
    if (!themeButton) {
        return;
    }
    applyTheme(currentTheme); // sets the button's text
    themeButton.addEventListener("click", switchTheme);
    themeButton.hidden = false;
});
