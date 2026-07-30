document.addEventListener("DOMContentLoaded", initInvitePage);

async function initInvitePage() {
    try {

        const user = await OmnoraAuth.getCurrentUser();

        if (!user) {
            window.location.href = "student-login.html";
            return;
        }

        const supabase = window.supabaseClient;

        const { data: profile, error } = await supabase
            .from("profiles")
            .select("referral_code, oms_points")
            .eq("id", user.id)
            .single();

        if (error) throw error;

        const referralLink =
`${window.location.origin}/omnora-student-ai/student-register.html?ref=${profile.referral_code}`;

        document.getElementById("referral-link").value =
            referralLink;

        document.getElementById("oms-points").textContent =
            profile.oms_points ?? 0;

        loadReferralCount(user.id);

        setupShareButtons(referralLink);

    } catch (err) {

        console.error(err);

    }
}

async function loadReferralCount(userId) {
loadReferralHistory(user.id);

    const supabase = window.supabaseClient;

    const { count } = await supabase
        .from("student_referrals")
        .select("*", {
            count: "exact",
            head: true
        })
        .eq("inviter_profile_id", userId);

    document.getElementById("successful-referrals").textContent =
        count ?? 0;
}

function setupShareButtons(link) {

    document
        .getElementById("copy-link-btn")
        .onclick = async () => {

            await navigator.clipboard.writeText(link);

            alert("Referral link copied.");

        };

    document
        .getElementById("share-whatsapp-btn")
        .onclick = () => {

            window.open(
                `https://wa.me/?text=${encodeURIComponent(link)}`
            );

        };

    document
        .getElementById("share-telegram-btn")
        .onclick = () => {

            window.open(
                `https://t.me/share/url?url=${encodeURIComponent(link)}`
            );

        };

    document
        .getElementById("share-x-btn")
        .onclick = () => {

            window.open(
                `https://twitter.com/intent/tweet?text=${encodeURIComponent(link)}`
            );

        };

}
async function loadReferralHistory(userId) {

    const supabase = window.supabaseClient;

    const { data, error } = await supabase
        .from("student_referrals")
        .select(`
            reward_points,
            status,
            created_at,
            invited:profiles!student_referrals_invited_profile_id_fkey(
                full_name,
                oms_id
            )
        `)
        .eq("inviter_profile_id", userId)
        .order("created_at", { ascending:false });

    if (error) throw error;

    const container =
        document.getElementById("referral-history-list");

    if (!data.length) {

        container.innerHTML =
            '<div class="history-empty">No referrals yet.</div>';

        return;

    }

    container.innerHTML = "";

    data.forEach(ref => {

        container.innerHTML += `

<div class="referral-history-item">

<div class="history-left">

<h4>${ref.invited.full_name}</h4>

<p>${ref.invited.oms_id}</p>

</div>

<div class="history-right">

<div class="reward">
+${ref.reward_points} OMS
</div>

<div class="status">
${ref.status}
</div>

</div>

</div>

`;

    });

}
