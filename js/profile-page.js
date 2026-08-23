document.addEventListener("DOMContentLoaded", async () => {

    console.clear();

    console.log("========== PROFILE DEBUG ==========");

    console.log("Current URL:", window.location.href);

    console.log("Supabase Client:", window.supabaseClient);

    if (!window.supabaseClient) {
        console.error("❌ Supabase Client NOT FOUND");
        return;
    }

    const {
        data: { session },
        error: sessionError
    } = await window.supabaseClient.auth.getSession();

    console.log("SESSION:", session);

    console.log("SESSION ERROR:", sessionError);

    if (!session) {
        console.error("❌ No session");
        return;
    }

    console.log("USER:", session.user);

    const {
        data: profile,
        error: profileError
    } = await window.supabaseClient
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

    console.log("PROFILE:", profile);

    console.log("PROFILE ERROR:", profileError);

});

/* ==========================================
   FREUMIA STUDENTS AI V2
   PROFILE PAGE
========================================== */

document.addEventListener("DOMContentLoaded", async () => {

    if (!window.supabaseClient) {
        console.error("Supabase Client not found.");
        return;
    }

    console.log("Profile page loaded");

const {
    data: { session }
} = await window.supabaseClient.auth.getSession();

console.log("SESSION:", session);

if (!session) {
    console.log("No session found");
    window.location.href = "auth-page.html";
    return;
}

const user = session.user;

console.log("USER:", user);

   console.log("USER METADATA:", user.user_metadata);

   console.log("APP METADATA:", user.app_metadata);

    /* ==========================================
       PROFILE ELEMENTS
    ========================================== */

    const avatar = document.getElementById("profile-image");
    const studentName = document.getElementById("student-name");
    const studentEmail = document.getElementById("student-email");
    const memberSince = document.getElementById("member-since");

    const fullName = document.getElementById("full-name");
    const email = document.getElementById("email-address");

    const schoolName = document.getElementById("school-name");
    const country = document.getElementById("country");
    const studentClass = document.getElementById("student-class");
    const admissionNumber = document.getElementById("admission-number");

    /* ==========================================
       USER DATA
    ========================================== */

    const profilePhoto =
        user.user_metadata.avatar_url ||
        "assets/images/default-avatar.png";

    const name =
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    "Student";

    const joinedYear =
        new Date(user.created_at).getFullYear();

    avatar.src = profilePhoto;

    studentName.textContent = name;
    studentEmail.textContent = user.email;
    memberSince.textContent = "Joined Freumia • " + joinedmonth + joinedYear;

    fullName.value = name;
    email.value = user.email;

    /* ==========================================
       OPTIONAL LOCAL PROFILE
    ========================================== */

    const { data: profile } =
await window.supabaseClient
.from("profiles")
.select("*")
.eq("id", user.id)
.single();

if (profile) {

    studentName.textContent =
    profile.full_name || studentName.textContent;

fullName.value =
    profile.full_name || "";

    schoolName.value =
        profile.school_name || "";

    country.value =
    profile.country || "";

    studentClass.value =
    profile.class_level || "";

    admissionNumber.value =
        profile.admission_number || "";

if (profile.avatar_url && avatar) {
    avatar.src = profile.avatar_url + "?t=" + Date.now();
}

}
   const editButton =
document.getElementById("edit-profile-btn");

if (editButton) {
    editButton.addEventListener("click", editProfile);
}
    const avatarUpload =
document.getElementById("avatar-upload");

if (avatar && avatarUpload) {
    avatar.addEventListener("click", () => {
        avatarUpload.click();
    });

    /* ==========================================
   AVATAR UPLOAD
========================================== */

avatarUpload.addEventListener("change", async (event) => {

    const file = event.target.files[0];

    if (!file) return;

    try {

        const {
            data: { session }
        } = await window.supabaseClient.auth.getSession();

        if (!session) {
            alert("Please login again.");
            return;
        }

        const user = session.user;

        /* ==============================
           Generate unique filename
        ============================== */

        const extension =
            file.name.split(".").pop();

        const fileName =
            `${user.id}-${Date.now()}.${extension}`;

        /* ==============================
           Upload to Storage
        ============================== */

        const { error: uploadError } =
            await window.supabaseClient.storage
            .from("avatars")
            .upload(fileName, file, {
                cacheControl: "3600",
                upsert: true
            });

        if (uploadError)
            throw uploadError;

        /* ==============================
           Get Public URL
        ============================== */

        const {
            data: publicData
        } = window.supabaseClient.storage
            .from("avatars")
            .getPublicUrl(fileName);

        const avatarUrl =
            publicData.publicUrl;

        /* ==============================
           Save URL to profiles table
        ============================== */

        const { error: profileError } =
            await window.supabaseClient
            .from("profiles")
            .update({
                avatar_url: avatarUrl
            })
            .eq("id", user.id);

        if (profileError)
            throw profileError;

        /* ==============================
           Update UI instantly
        ============================== */

        avatar.src = avatarUrl + "?t=" + Date.now();

        alert("✅ Avatar updated successfully.");

    } catch (error) {

        console.error(error);

        alert("❌ Avatar upload failed.\n\n" + error.message);

    }

});

}

    });


/* ==========================================
   EDIT PROFILE
========================================== */

let editMode = false;

async function editProfile() {

    const button = document.getElementById("edit-profile-btn");

    const school =
        document.getElementById("school-name");

    const studentClass =
        document.getElementById("student-class");

    const admission =
        document.getElementById("admission-number");

    if (!editMode) {

        school.removeAttribute("readonly");

        studentClass.disabled = false;

        admission.removeAttribute("readonly");

        button.textContent = "💾 Save Profile";

        editMode = true;

        return;

    }

    const {
        data: {
            session
        }
    } = await window.supabaseClient.auth.getSession();

    if (!session) return;

    const user = session.user;

    const { error } =
        await window.supabaseClient
        .from("profiles")
        .upsert({

            id: user.id,

            school_name: school.value,

            class_level: studentClass.value,

            admission_number: admission.value

        });

    if (error) {

        alert(error.message);

        return;

    }

    school.setAttribute("readonly", true);

    studentClass.disabled = true;

    admission.setAttribute("readonly", true);

    button.textContent = "✏️ Edit Profile";

    editMode = false;

    alert("✅ Profile updated successfully.");

}


/* ==========================================
   CHANGE PIN
========================================== */

const pinButton =
document.getElementById("change-pin-btn");

if (pinButton) {

    pinButton.addEventListener("click", () => {

        alert("PIN feature coming soon.");

    });

}


/* ==========================================
   LOGOUT
========================================== */

const logoutButton =
document.getElementById("logout-btn");

if (logoutButton) {

    logoutButton.addEventListener("click", async () => {

        const confirmLogout = confirm(
            "Are you sure you want to logout?"
        );

        if (!confirmLogout) return;

        const { error } =
        await window.supabaseClient.auth.signOut();

        if (error) {
            alert(error.message);
            return;
        }

        window.location.href = "index.html";

    });

}


/* ==========================================
   DARK MODE
========================================== */

const themeToggle =
document.getElementById("theme-toggle");

if (themeToggle) {

    themeToggle.addEventListener("change", async () => {
    await window.themeEngine.toggleTheme();
});

}
