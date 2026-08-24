/**
 * ==========================================================
 * Omnora Students AI V2
 * Student Login Controller
 * File: js/student-login.js
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("studentLoginForm");

    if (!form) return;

    form.addEventListener("submit", handleStudentLogin);
});

/**
 * Student Login
 */
async function handleStudentLogin(event) {

    event.preventDefault();

    try {

        // ------------------------------------------
        // Collect Form Data
        // ------------------------------------------

        const loginData = {
            fmsId: getValue("fmsId").toUpperCase(),
            password: getValue("password"),
            rememberMe: document.getElementById("rememberMe")?.checked || false
        };

        // ------------------------------------------
        // Validation
        // ------------------------------------------

        const validation = validateLogin(loginData);

        if (!validation.success) {
            return showError(validation.message);
        }

        // ------------------------------------------
        // Loading
        // ------------------------------------------

        showLoading(true);

        // ------------------------------------------
        // Authentication
        // ------------------------------------------

        const result = await OmnoraAuth.loginStudent(loginData);

        // ------------------------------------------
        // Success
        // ------------------------------------------

        if (result.success) {

            showSuccess("Login successful.");

            window.location.href="index.html";

            return;

        }

        // ------------------------------------------
        // Error
        // ------------------------------------------

        showError(result.message);

    } catch (error) {

        console.error(error);

        showError("Unable to sign in. Please try again.");

    } finally {

        showLoading(false);

    }

}

/**
 * Validate Login
 */
function validateLogin(data) {

    if (!data.fmsId.trim()) {

        return {
            success: false,
            message: "Please enter your FMS-ID."
        };

    }

    if (!/^FMS-\d{6}$/.test(data.fmsId)) {

        return {
            success: false,
            message: "Invalid FMS-ID format."
        };

    }

    if (!data.password) {

        return {
            success: false,
            message: "Password is required."
        };

    }

    return {
        success: true
    };

}

/**
 * Get Input Value
 */
function getValue(id) {

    const input = document.getElementById(id);

    return input ? input.value.trim() : "";

}

/**
 * Loading UI
 */
function showLoading(status) {

    const button = document.querySelector(
        "#studentLoginForm button[type='submit']"
    );

    if (!button) return;

    button.disabled = status;

    button.textContent = status
        ? "Signing In..."
        : "🚀 Sign In";

}

/**
 * Success UI
 */
function showSuccess(message) {

    console.log(message);

}

/**
 * Error UI
 */
function showError(message) {

    alert(message);

}
