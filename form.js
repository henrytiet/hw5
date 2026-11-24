/*
  form.js: enhancements for form-with-js.html.

  The form already validates and submits with HTML alone. This script adds:
    1. Specific error messages, shown in the page and in the browser's bubble.
    2. A remaining-character counter for the comments field.
    3. A history of failed submission attempts, sent along in a hidden field.
*/

// Warn when this many characters (or fewer) are left in the comments field.
const WARNING_THRESHOLD = 100;

// History of validation errors from failed submission attempts.
const form_errors = [];

const form = document.querySelector("#contact-form");
const comments = document.querySelector("#comments");
const countMessage = document.querySelector("#comments-count");
const errorArea = document.querySelector("#error-area");
const errorBox = document.querySelector("#error-box");
const errorList = document.querySelector("#error-list");

// One object per visible field.
//   edited:    the person has typed in the field
//   showError: the field's error may be shown in the page
//              (after leaving an edited field, or after a submission attempt)
const fields = [
    {
        input: document.querySelector("#name"),
        label: "Name",
        missingMessage: "Enter your name.",
        edited: false,
        showError: false
    },
    {
        input: document.querySelector("#email"),
        label: "Email",
        missingMessage: "Enter your email address.",
        edited: false,
        showError: false
    },
    {
        input: comments,
        label: "Comments",
        missingMessage: "Enter a message.",
        edited: false,
        showError: false
    }
];

/* ===== Validation ===== */

// Returns a message describing what is wrong with a field, or "" if it is valid.
function findProblem(field) {
    const input = field.input;

    // Clear the old custom message first. Otherwise the field would still
    // count as invalid after it has been corrected.
    input.setCustomValidity("");

    if (input.validity.valueMissing) {
        return field.missingMessage;
    }
    if (input.validity.typeMismatch) {
        return "Enter a complete email address, such as name@domain.com.";
    }
    if (input.validity.tooShort) {
        return "Enter at least " + input.minLength + " characters.";
    }
    if (!input.validity.valid) {
        // Any other problem: fall back to the browser's own message.
        return input.validationMessage;
    }
    return "";
}

// aria-describedby holds a space-separated list of ids. These two helpers
// add or remove one id without disturbing the others (such as the hint's id).
function addDescription(input, id) {
    const ids = (input.getAttribute("aria-describedby") || "").split(" ");
    if (!ids.includes(id)) {
        ids.push(id);
        input.setAttribute("aria-describedby", ids.join(" ").trim());
    }
}

function removeDescription(input, id) {
    const ids = (input.getAttribute("aria-describedby") || "").split(" ");
    const remaining = ids.filter(function (existingId) {
        return existingId !== id;
    });
    input.setAttribute("aria-describedby", remaining.join(" "));
}

// Shows, updates, or removes a field's entry in the error area.
function renderError(field, message) {
    const input = field.input;
    const errorId = input.id + "-error";
    let item = document.querySelector("#" + errorId);

    if (message === "") {
        if (item) {
            item.remove();
        }
        removeDescription(input, errorId);
        input.removeAttribute("aria-invalid");
    } else {
        if (!item) {
            item = document.createElement("li");
            item.id = errorId;
            errorList.append(item);
        }
        const text = field.label + ": " + message;
        // Only touch the text when it changes, so screen readers do not
        // re-announce the same error on every keystroke.
        if (item.textContent !== text) {
            item.textContent = text;
        }
        addDescription(input, errorId);
        input.setAttribute("aria-invalid", "true");
    }

    // Hide the whole box when there are no errors left.
    errorBox.hidden = errorList.children.length === 0;
}

// Rechecks one field. This reads .validity only; it never calls
// checkValidity() or reportValidity(), so it never fires an "invalid" event.
function checkField(field) {
    const message = findProblem(field);
    field.input.setCustomValidity(message);
    if (field.showError) {
        renderError(field, message);
    }
    return message;
}

/* ===== Character count ===== */

function updateCount() {
    const remaining = comments.maxLength - comments.value.length;

    countMessage.classList.remove("count-warning", "count-limit");

    if (remaining <= 0) {
        countMessage.textContent = "Limit reached: 0 characters left";
        countMessage.classList.add("count-limit");
    } else if (remaining <= WARNING_THRESHOLD) {
        countMessage.textContent = "Warning: only " + remaining + " characters left";
        countMessage.classList.add("count-warning");
    } else {
        countMessage.textContent = remaining + " characters left";
    }
}

/* ===== Events ===== */

fields.forEach(function (field) {
    // Typing, pasting, or deleting: recheck quietly. An error that is already
    // on screen updates or disappears; a new one does not appear mid-typing.
    field.input.addEventListener("input", function () {
        field.edited = true;
        checkField(field);
    });

    // Leaving a field that has been edited: its error may now be shown.
    field.input.addEventListener("blur", function () {
        if (field.edited) {
            field.showError = true;
            checkField(field);
        }
    });

    // The browser fires "invalid" on each invalid field when a submission is
    // blocked, whether it came from the button or from the keyboard. Nothing
    // else in this script triggers it, so each event is one failed attempt
    // for that field.
    field.input.addEventListener("invalid", function () {
        field.showError = true;
        const message = checkField(field);
        form_errors.push({
            field: field.input.name,
            message: message,
            time: new Date().toISOString()
        });
    });
});

comments.addEventListener("input", updateCount);

// Hidden field that carries the error history. It is created here so that,
// without JavaScript, the form does not submit an empty history.
const historyField = document.createElement("input");
historyField.type = "hidden";
historyField.name = "form-errors";
form.append(historyField);

// "submit" only fires once every field is valid, right before the request.
form.addEventListener("submit", function () {
    historyField.value = JSON.stringify(form_errors);
});

/* ===== Start up ===== */

// Set the custom messages now so the very first submission attempt already
// shows them. Nothing appears in the page yet, because showError is false.
fields.forEach(checkField);

// Reveal the JavaScript-only error area and start the counter.
errorArea.hidden = false;
updateCount();
