/**
 * ==========================================================
 * Freumia Students AI
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
 * ==========================================================
 * SAVE REFERRAL FROM URL
 * ==========================================================
 */

function saveReferralFromUrl() {

    const params = new URLSearchParams(
        window.location.search
    );

    const referralCode = params.get("ref");

    if (!referralCode) return;

    sessionStorage.setItem(
        "freumia_referral",
        referralCode
    );

    console.log(
        "Referral saved:",
        referralCode
    );
}


/**
 * ==========================================================
 * STUDENT REGISTRATION
 * ==========================================================
 */

async function handleStudentRegistration(event) {

    event.preventDefault();

    try {

        // --------------------------------------------------
        // Collect Form Data
        // --------------------------------------------------

        const formData = {

            full_name: getValue("fullName"),

            school_name: getValue("schoolName"),

            admission_number:
                getValue("admissionNumber"),

            class_level:
                getValue("classLevel"),

            gender:
                getValue("gender"),

            country:
                getValue("country"),

            state:
                getValue("state"),

            city:
                getValue("city"),

            date_of_birth:
                getValue("dateOfBirth"),

            goal:
                getValue("goal"),

            password:
                getValue("password"),

            confirm_password:
                getValue("confirmPassword"),

            accepted_terms:
                document
                    .getElementById("terms")
                    .checked

        };


        // --------------------------------------------------
        // Validation
        // --------------------------------------------------

        const validation =
            validateRegistration(formData);


        if (!validation.success) {

            return showError(
                validation.message
            );

        }


        // --------------------------------------------------
        // Loading
        // --------------------------------------------------

        showLoading(true);


        // --------------------------------------------------
        // Send To Authentication Layer
        // --------------------------------------------------

        console.log(
            "Submitting registration..."
        );

        console.log(formData);


        const result =
            await OmnoraAuth
                .registerStudent(formData);


        console.log(
            "Registration Result:",
            result
        );


        // --------------------------------------------------
        // Success
        // --------------------------------------------------

        if (result.success) {

            showRegistrationSuccess(
                result.oms_id
            );

            return;

        }


        // --------------------------------------------------
        // Error
        // --------------------------------------------------

        showError(
            result.message
        );

    }

    catch (error) {

        console.error(
            "Registration Error:",
            error
        );

        showError(
            error.message ||
            "Something went wrong."
        );

    }

    finally {

        showLoading(false);

    }

}


/**
 * ==========================================================
 * VALIDATE REGISTRATION FORM
 * ==========================================================
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
            message:
                "Password must be at least 8 characters."
        };

    }


    if (
        data.password !==
        data.confirm_password
    ) {

        return {
            success: false,
            message: "Passwords do not match."
        };

    }


    if (!data.accepted_terms) {

        return {
            success: false,
            message:
                "Please accept the Terms & Privacy Policy."
        };

    }


    return {
        success: true
    };

}


/**
 * ==========================================================
 * GET INPUT VALUE
 * ==========================================================
 */

function getValue(id) {

    const input =
        document.getElementById(id);

    return input
        ? input.value.trim()
        : "";

}


/**
 * ==========================================================
 * LOADING UI
 * ==========================================================
 */

function showLoading(status) {

    const button =
        document.querySelector(
            "#studentRegisterForm button[type='submit']"
        );


    if (!button) return;


    button.disabled = status;


    button.textContent = status
        ? "Creating Account..."
        : "Create Student Account";

}


/**
 * ==========================================================
 * REGISTRATION SUCCESS CARD
 * ==========================================================
 */

function showRegistrationSuccess(
    omsId
) {

    /*
    ------------------------------------------
    Prevent duplicate card
    ------------------------------------------
    */

    const existing =
        document.getElementById(
            "registration-success-modal"
        );


    if (existing) {
        existing.remove();
    }


    /*
    ------------------------------------------
    Create Modal
    ------------------------------------------
    */

    const modal =
        document.createElement("div");

    modal.id =
        "registration-success-modal";


    modal.innerHTML = `

        <div class="registration-success-overlay">

            <div class="registration-success-card">

                <button
                    type="button"
                    class="success-close"
                    id="success-close-btn"
                    aria-label="Close"
                >
                    ×
                </button>


                <div class="success-icon">
                    🎉
                </div>


                <h2>
                    Registration Successful!
                </h2>


                <p class="success-subtitle">
                    Your student account has been
                    created successfully.
                </p>


                <div class="student-id-section">

                    <span class="student-id-label">
                        Your Student ID
                    </span>


                    <div class="student-id-box">

                        <span
                            id="student-id-value"
                        >
                            ${escapeHtml(fmsId)}
                        </span>


                        <button
                            type="button"
                            id="copy-fms-id-btn"
                            class="copy-fms-id-btn"
                        >
                            📋
                        </button>

                    </div>

                </div>


                <button
                    type="button"
                    id="copy-fms-id-main-btn"
                    class="copy-fms-id-main-btn"
                >
                    📋 Copy FMS-ID
                </button>


                <p class="save-message">

                    Please save your
                    <strong>FMS-ID</strong>
                    carefully.

                    <br>

                    You will use it every time
                    you log in.

                </p>


                <button
                    type="button"
                    id="continue-login-btn"
                    class="continue-login-btn"
                >
                    Continue to Login
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(modal);


    /*
    ------------------------------------------
    Add Styles
    ------------------------------------------
    */

    addRegistrationSuccessStyles();


    /*
    ------------------------------------------
    Copy Buttons
    ------------------------------------------
    */

    const copyButton =
        document.getElementById(
            "copy-fms-id-btn"
        );


    const copyMainButton =
        document.getElementById(
            "copy-fms-id-main-btn"
        );


    copyButton.addEventListener(
        "click",
        () => {

            copyFMSId(
                fmsId,
                copyButton
            );

        }
    );


    copyMainButton.addEventListener(
        "click",
        () => {

            copyFMSId(
                fmsId,
                copyMainButton
            );

        }
    );


    /*
    ------------------------------------------
    Continue To Login
    ------------------------------------------
    */

    const continueButton =
        document.getElementById(
            "continue-login-btn"
        );


    continueButton.addEventListener(
        "click",
        () => {

            window.location.href =
                "student-login.html";

        }
    );


    /*
    ------------------------------------------
    Close Button
    ------------------------------------------
    */

    const closeButton =
        document.getElementById(
            "success-close-btn"
        );


    closeButton.addEventListener(
        "click",
        () => {

            modal.remove();

        }
    );

}


/**
 * ==========================================================
 * COPY FMS-ID
 * ==========================================================
 */

async function copyFMSId(
    fmsId,
    button
) {

    try {

        await navigator.clipboard.writeText(
            fmsId
        );


        const originalText =
            button.innerHTML;


        button.innerHTML =
            "✓ Copied!";


        button.classList.add(
            "copied"
        );


        setTimeout(
            () => {

                button.innerHTML =
                    originalText;

                button.classList.remove(
                    "copied"
                );

            },
            2000
        );


    }

    catch (error) {

        console.error(
            "Copy FMS-ID failed:",
            error
        );


        /*
        --------------------------------------
        Fallback
        --------------------------------------
        */

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            omsId;


        textarea.style.position =
            "fixed";

        textarea.style.opacity =
            "0";


        document.body.appendChild(
            textarea
        );


        textarea.select();


        try {

            document.execCommand(
                "copy"
            );


            button.innerHTML =
                "✓ Copied!";


        }

        catch (fallbackError) {

            alert(
                "Please copy your FMS-ID manually: " +
                fmsId
            );

        }


        textarea.remove();

    }

}


/**
 * ==========================================================
 * ESCAPE HTML
 * ==========================================================
 */

function escapeHtml(value) {

    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/**
 * ==========================================================
 * SUCCESS CARD STYLES
 * ==========================================================
 */

function addRegistrationSuccessStyles() {

    if (
        document.getElementById(
            "registration-success-styles"
        )
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "registration-success-styles";


    style.textContent = `

        #registration-success-modal {
            position: fixed;
            inset: 0;
            z-index: 99999;
        }


        .registration-success-overlay {
            position: fixed;
            inset: 0;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 20px;

            background:
                rgba(2, 8, 23, 0.82);

            backdrop-filter:
                blur(10px);

            -webkit-backdrop-filter:
                blur(10px);

            overflow-y: auto;
        }


        .registration-success-card {

            position: relative;

            width: 100%;
            max-width: 470px;

            padding: 32px 24px;

            border-radius: 28px;

            background:
                linear-gradient(
                    145deg,
                    #111c32,
                    #081426
                );

            border:
                1px solid
                rgba(255,255,255,0.10);

            box-shadow:
                0 30px 80px
                rgba(0,0,0,0.55);

            color: #ffffff;

            text-align: center;

            animation:
                successCardIn
                0.35s
                ease-out;
        }


        @keyframes successCardIn {

            from {
                opacity: 0;
                transform:
                    translateY(25px)
                    scale(0.96);
            }

            to {
                opacity: 1;
                transform:
                    translateY(0)
                    scale(1);
            }

        }


        .success-close {

            position: absolute;

            top: 14px;
            right: 16px;

            width: 36px;
            height: 36px;

            border: 0;
            border-radius: 50%;

            background:
                rgba(255,255,255,0.08);

            color: #ffffff;

            font-size: 25px;

            cursor: pointer;

        }


        .success-icon {

            width: 72px;
            height: 72px;

            margin:
                0 auto 18px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 50%;

            background:
                linear-gradient(
                    135deg,
                    #5b5cff,
                    #963cff
                );

            font-size: 34px;

            box-shadow:
                0 10px 35px
                rgba(91,92,255,0.35);

        }


        .registration-success-card h2 {

            margin:
                0 0 10px;

            font-size: 28px;

            font-weight: 700;

        }


        .success-subtitle {

            margin:
                0 0 26px;

            color:
                rgba(255,255,255,0.65);

            font-size: 15px;

            line-height: 1.6;

        }


        .student-id-section {

            margin-bottom: 16px;

            text-align: left;

        }


        .student-id-label {

            display: block;

            margin-bottom: 8px;

            color:
                rgba(255,255,255,0.60);

            font-size: 13px;

            font-weight: 600;

        }


        .student-id-box {

            display: flex;

            align-items: center;

            justify-content: space-between;

            gap: 10px;

            padding:
                14px 14px 14px 18px;

            border-radius: 14px;

            background:
                rgba(255,255,255,0.06);

            border:
                1px solid
                rgba(255,255,255,0.08);

        }


        #student-id-value {

            font-size: 20px;

            font-weight: 700;

            letter-spacing: 1px;

            color: #ffffff;

            word-break: break-word;

        }


        .copy-fms-id-btn {

            flex-shrink: 0;

            width: 42px;
            height: 42px;

            border: 0;

            border-radius: 10px;

            background:
                rgba(91,92,255,0.18);

            color: #ffffff;

            font-size: 18px;

            cursor: pointer;

        }


        .copy-fms-id-main-btn,
        .continue-login-btn {

            width: 100%;

            min-height: 54px;

            border: 0;

            border-radius: 15px;

            font-size: 16px;

            font-weight: 700;

            cursor: pointer;

            transition:
                transform 0.2s ease,
                opacity 0.2s ease;

        }


        .copy-fms-id-main-btn {

            margin-bottom: 20px;

            background:
                linear-gradient(
                    135deg,
                    #5b5cff,
                    #963cff
                );

            color: #ffffff;

            box-shadow:
                0 10px 25px
                rgba(91,92,255,0.25);

        }


        .continue-login-btn {

            background:
                rgba(255,255,255,0.08);

            color: #ffffff;

            border:
                1px solid
                rgba(255,255,255,0.10);

        }


        .copy-fms-id-main-btn:hover,
        .continue-login-btn:hover,
        .copy-fms-id-btn:hover {

            transform:
                translateY(-1px);

        }


        .copy-fms-id-main-btn.copied,
        .copy-fms-id-btn.copied {

            background:
                #16a34a;

        }


        .save-message {

            margin:
                0 0 22px;

            color:
                rgba(255,255,255,0.60);

            font-size: 14px;

            line-height: 1.7;

        }


        .save-message strong {

            color: #ffffff;

        }


        @media (max-width: 480px) {

            .registration-success-overlay {
                padding: 14px;
            }


            .registration-success-card {

                padding:
                    28px 20px;

                border-radius: 24px;

            }


            .registration-success-card h2 {

                font-size: 24px;

            }


            #student-id-value {

                font-size: 18px;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/**
 * ==========================================================
 * ERROR UI
 * ==========================================================
 */

function showError(message) {

    alert(message);

            }
