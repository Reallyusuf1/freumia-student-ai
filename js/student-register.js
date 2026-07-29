/**
 * ==========================================================
 * Omnora Students AI V2
 * Student Registration Controller
 * File: js/student-register.js
 * ==========================================================
 */

document.addEventListener("DOMContentLoaded", () => {

    saveReferralFromUrl();

    const form = document.getElementById("studentRegisterForm");

    if (!form) return;

    form.addEventListener("submit", handleStudentRegistration);

});

/**
 * Student Registration
 */
function saveReferralFromUrl() {

    const params = new URLSearchParams(window.location.search);

    const referralCode = params.get("ref");

    if (!referralCode) return;

    sessionStorage.setItem(
        "omnora_referral",
        referralCode
    );

    console.log(
        "Referral saved:",
        referralCode
    );

}
async function handleStudentRegistration(event) {
    event.preventDefault();

    try {
        // --------------------------------------------------
        // Collect Form Data
        // --------------------------------------------------

        const formData = {
    full_name: getValue("fullName"),
    school_name: getValue("schoolName"),
    admission_number: getValue("admissionNumber"),
    class_level: getValue("classLevel"),
    gender: getValue("gender"),
    country: getValue("country"),
    state: getValue("state"),
    city: getValue("city"),
    date_of_birth: getValue("dateOfBirth"),
    goal: getValue("goal"),
    password: getValue("password"),
    confirm_password: getValue("confirmPassword"),
    accepted_terms: document.getElementById("terms").checked
};

        // --------------------------------------------------
        // Validation
        // --------------------------------------------------

        const validation = validateRegistration(formData);

        if (!validation.success) {
            return showError(validation.message);
        }

        // --------------------------------------------------
        // Loading
        // --------------------------------------------------

        showLoading(true);

        // --------------------------------------------------
        // Send To Authentication Layer
        // --------------------------------------------------

        console.log("Submitting registration...");
console.log(formData);

const result = await OmnoraAuth.registerStudent(formData);

console.log("Registration Result:", result);

        // --------------------------------------------------
        // Success
        // --------------------------------------------------

        if (result.success) {

            const proceed = confirm(
`🎉 Registration Successful!

Your Student ID is:

${result.oms_id}

Please save this OMS-ID carefully.
You will use it every time you log in.

Press OK to continue to Login Page.`
);

if (proceed) {
    window.location.href = "student-login.html";
}

return;

    }

        // --------------------------------------------------
        // Error
        // --------------------------------------------------

        showError(result.message);

    }
        catch (error) {

    console.error("Registration Error:", error);


    showError(error.message || "Something went wrong.");

        }
    
        finally {

        showLoading(false);

    }
}

/**
 * Validate Registration Form
 */
function validateRegistration(data) {

    if (!data.full_name.trim()) {
        return {
            success: false,
            message: "Full Name is required."
        };
    }

    if (!data.school_name.trim()) {
        return {
            success: false,
            message: "School Name is required."
        };
    }

    if (!data.country.trim()) {
        return {
            success: false,
            message: "Country is required."
        };
    }

    if (!data.password) {
        return {
            success: false,
            message: "Password is required."
        };
    }

    if (data.password.length < 8) {
        return {
            success: false,
            message: "Password must be at least 8 characters."
        };
    }

    if (data.password !== data.confirm_password) {
        return {
            success: false,
            message: "Passwords do not match."
        };
    }

    if (!data.accepted_terms) {
        return {
            success: false,
            message: "Please accept the Terms & Privacy Policy."
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
        "#studentRegisterForm button[type='submit']"
    );

    if (!button) return;

    button.disabled = status;

    button.textContent = status
        ? "Creating Account..."
        : "Create Student Account";

}

/**
 * Success UI
 */
function showSuccess(message) {

    console.log("SUCCESS MESSAGE:");

    console.log(message);

    alert(message);

}

/**
 * Error UI
 */
function showError(message) {

    alert(message);

}
