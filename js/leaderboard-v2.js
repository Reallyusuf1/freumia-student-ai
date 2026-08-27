/* =========================================================
   FREUMIA STUDENTS AI
   Leaderboard V2
   Data + interaction layer
========================================================= */

(() => {
    "use strict";

    const CONFIG = Object.freeze({
        supabaseUrl: "https://qnheojayfgtdohmezxju.supabase.co",

        // Existing Freumia Supabase publishable key
        supabaseKey: "sb_publishable_xds1jJt0bjywElP-9tN_sg_TUBC6zgT",

        leaderboardFunction: "get_leaderboard",
        defaultPeriod: "all_time",
        defaultLimit: 100,

        periodMap: Object.freeze({
            "all-time": "all_time",
            "month": "monthly",
            "week": "weekly",
            "today": "daily"
        }),

        fallbackAvatar: "assets/images/default-avatar.png"
    });

    const state = {
        period: CONFIG.defaultPeriod,
        rows: [],
        profiles: new Map(),
        loading: false
    };

    const elements = {};

    /* =========================================================
       DOM
    ========================================================= */

    function cacheElements() {
        elements.body = document.body;

        elements.mobileMenuButton =
            document.getElementById("mobile-menu-button");

        elements.navActions =
            document.getElementById("leaderboard-nav-actions");

        elements.notificationButton =
            document.getElementById("notification-button");

        elements.notificationCount =
            document.getElementById("notification-count");

        elements.periodTabs =
            document.querySelectorAll(".period-tab");

        elements.tableBody =
            document.getElementById("leaderboard-table-body");

        elements.topThree =
            document.getElementById("top-three-section");

        elements.statStudents =
            document.getElementById("stat-students-value");

        elements.statSchools =
            document.getElementById("stat-schools-value");

        elements.statQuizzes =
            document.getElementById("stat-quizzes-value");

        elements.statAccuracy =
            document.getElementById("stat-accuracy-value");

        elements.footerYear =
            document.getElementById("footer-year");
    }

    /* =========================================================
       SUPABASE
    ========================================================= */

    async function ensureSupabaseClient() {
        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (!window.supabase) {
            await loadScript(
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
            );
        }

        if (!window.supabase) {
            throw new Error("Supabase SDK failed to load.");
        }

        window.supabaseClient =
            window.supabase.createClient(
                CONFIG.supabaseUrl,
                CONFIG.supabaseKey
            );

        return window.supabaseClient;
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const existing =
                document.querySelector(
                    `script[src="${src}"]`
                );

            if (existing) {
                if (window.supabase) {
                    resolve();
                    return;
                }

                existing.addEventListener(
                    "load",
                    resolve,
                    { once: true }
                );

                existing.addEventListener(
                    "error",
                    reject,
                    { once: true }
                );

                return;
            }

            const script =
                document.createElement("script");

            script.src = src;
            script.async = true;

            script.addEventListener(
                "load",
                resolve,
                { once: true }
            );

            script.addEventListener(
                "error",
                () => {
                    reject(
                        new Error(
                            `Unable to load dependency: ${src}`
                        )
                    );
                },
                { once: true }
            );

            document.head.appendChild(script);
        });
    }

    /* =========================================================
       LEADERBOARD RPC
    ========================================================= */

    async function fetchLeaderboard(period) {
        const client =
            await ensureSupabaseClient();

        const { data, error } =
            await client.rpc(
                CONFIG.leaderboardFunction,
                {
                    p_period: period,
                    p_class_level: null,
                    p_school_name: null,
                    p_limit: CONFIG.defaultLimit
                }
            );

        if (error) {
            throw error;
        }

        return Array.isArray(data)
            ? data
            : [];
    }

    /* =========================================================
       REAL PROFILE DATA
    ========================================================= */

    async function fetchProfiles(profileIds) {
        if (!profileIds.length) {
            return new Map();
        }

        const client =
            await ensureSupabaseClient();

        const { data, error } =
            await client
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    school_name,
                    class_level,
                    admission_number,
                    country,
                    state,
                    city,
                    avatar_url
                `)
                .in("id", profileIds);

        if (error) {
            console.warn(
                "Profile enrichment unavailable:",
                error.message
            );

            return new Map();
        }

        return new Map(
            (data || []).map(profile => [
                String(profile.id),
                profile
            ])
        );
    }

    /* =========================================================
       GLOBAL / PERIOD STATS
    ========================================================= */

    async function fetchStats(
        period,
        leaderboardRows
    ) {
        const client =
            await ensureSupabaseClient();

        const stats = {
            students: null,
            schools: null,
            quizzes: null,
            accuracy: null
        };

        /*
         * Total registered students
         */
        try {
            const { count, error } =
                await client
                    .from("profiles")
                    .select("id", {
                        count: "exact",
                        head: true
                    })
                    .eq("role", "student");

            if (
                !error &&
                Number.isFinite(count)
            ) {
                stats.students = count;
            }
        } catch (error) {
            console.warn(
                "Student count unavailable:",
                error.message
            );
        }

        /*
         * Distinct schools
         */
        try {
            const { data, error } =
                await client
                    .from("profiles")
                    .select("school_name")
                    .eq("role", "student")
                    .not(
                        "school_name",
                        "is",
                        null
                    );

            if (!error) {
                const schools =
                    new Set(
                        (data || [])
                            .map(row =>
                                normalizeText(
                                    row.school_name
                                )
                            )
                            .filter(Boolean)
                    );

                stats.schools =
                    schools.size;
            }
        } catch (error) {
            console.warn(
                "School count unavailable:",
                error.message
            );
        }

        /*
         * Quiz statistics
         */
        try {
            let query =
                client
                    .from("quiz_attempts")
                    .select(
                        "score_percentage"
                    )
                    .eq(
                        "status",
                        "completed"
                    );

            query =
                applyPeriodFilter(
                    query,
                    period
                );

            const { data, error } =
                await query;

            if (!error) {
                const scores =
                    (data || [])
                        .map(row =>
                            Number(
                                row.score_percentage
                            )
                        )
                        .filter(
                            Number.isFinite
                        );

                stats.quizzes =
                    scores.length;

                if (scores.length) {
                    const total =
                        scores.reduce(
                            (sum, score) =>
                                sum + score,
                            0
                        );

                    stats.accuracy =
                        total /
                        scores.length;
                }
            }
        } catch (error) {
            console.warn(
                "Quiz statistics unavailable:",
                error.message
            );
        }

        /*
         * Safe fallbacks
         */
        if (
            stats.students === null
        ) {
            stats.students =
                leaderboardRows.length;
        }

        if (
            stats.schools === null
        ) {
            stats.schools =
                new Set(
                    leaderboardRows
                        .map(row =>
                            normalizeText(
                                row.school_name
                            )
                        )
                        .filter(Boolean)
                ).size;
        }

        if (
            stats.quizzes === null
        ) {
            stats.quizzes =
                leaderboardRows.reduce(
                    (sum, row) =>
                        sum +
                        toNumber(
                            row.total_quizzes
                        ),
                    0
                );
        }

        if (
            stats.accuracy === null
        ) {
            const weighted =
                leaderboardRows.reduce(
                    (accumulator, row) => {
                        const quizzes =
                            toNumber(
                                row.total_quizzes
                            );

                        const accuracy =
                            toNumber(
                                row.average_score
                            );

                        if (
                            quizzes > 0 &&
                            Number.isFinite(
                                accuracy
                            )
                        ) {
                            accumulator.total +=
                                accuracy *
                                quizzes;

                            accumulator.quizzes +=
                                quizzes;
                        }

                        return accumulator;
                    },
                    {
                        total: 0,
                        quizzes: 0
                    }
                );

            stats.accuracy =
                weighted.quizzes
                    ? weighted.total /
                      weighted.quizzes
                    : null;
        }

        return stats;
    }

    function applyPeriodFilter(
        query,
        period
    ) {
        if (period === "daily") {
            return query.eq(
                "quiz_date",
                currentDateString()
            );
        }

        if (period === "weekly") {
            return query.gte(
                "quiz_date",
                startOfWeekDateString()
            );
        }

        if (period === "monthly") {
            return query.gte(
                "quiz_date",
                startOfMonthDateString()
            );
        }

        return query;
    }

    /* =========================================================
       LOAD LEADERBOARD
    ========================================================= */

    async function loadLeaderboard() {
        if (state.loading) {
            return;
        }

        state.loading = true;

        setTableLoading();

        try {
            const period =
                state.period;

            const rows =
                await fetchLeaderboard(
                    period
                );

            state.rows = rows;

            const profileIds =
                rows
                    .map(row => row.id)
                    .filter(Boolean)
                    .map(String);

            state.profiles =
                await fetchProfiles(
                    profileIds
                );

            renderPodium(rows);

            renderTable(rows);

            const stats =
                await fetchStats(
                    period,
                    rows
                );

            renderStats(stats);

        } catch (error) {
            console.error(
                "Leaderboard loading failed:",
                error
            );

            renderTableError(
                "Unable to load the leaderboard right now."
            );

        } finally {
            state.loading = false;
        }
    }

    /* =========================================================
       PODIUM
    ========================================================= */

    function renderPodium(rows) {
        const podiumRows = {
            1: rows.find(
                row =>
                    Number(row.rank) === 1
            ),

            2: rows.find(
                row =>
                    Number(row.rank) === 2
            ),

            3: rows.find(
                row =>
                    Number(row.rank) === 3
            )
        };

        renderPodiumSlot(
            1,
            podiumRows[1]
        );

        renderPodiumSlot(
            2,
            podiumRows[2]
        );

        renderPodiumSlot(
            3,
            podiumRows[3]
        );

        [1, 2, 3].forEach(rank => {
            const card =
                document.getElementById(
                    `podium-${rankName(
                        rank
                    )}`
                );

            if (!card) {
                return;
            }

            card.hidden =
                !podiumRows[rank];
        });
    }

    function renderPodiumSlot(
        rank,
        row
    ) {
        const name =
            rankName(rank);

        const card =
            document.getElementById(
                `podium-${name}`
            );

        if (!card || !row) {
            return;
        }

        const profile =
            state.profiles.get(
                String(row.id)
            ) || {};

        const fullName =
            firstAvailable(
                profile.full_name,
                row.full_name
            ) || "Student";

        const school =
            firstAvailable(
                profile.school_name,
                row.school_name
            ) ||
            "School not provided";

        const classLevel =
            firstAvailable(
                profile.class_level,
                row.class_level
            ) ||
            "Class not provided";

        const country =
            normalizeText(
                firstAvailable(
                    profile.country
                )
            );

        const location =
            formatLocation(
                profile
            );

        const score =
            toNumber(
                row.total_points
            );

        setText(
            `${name}-name`,
            fullName
        );

        setText(
            `${name}-school`,
            school
        );

        setText(
            `${name}-class`,
            classLevel
        );

        setText(
            `${name}-score`,
            `${formatNumber(
                score
            )} pts`,
            true
        );

        renderPodiumScoreIcon(
            `${name}-score`
        );

        renderLocation(
            `${name}-location`,
            location
        );

        renderCountry(
            `${name}-country`,
            country
        );

        renderAvatar(
            `${name}-avatar`,
            `${name}-avatar-placeholder`,
            profile.avatar_url,
            fullName
        );

        card.hidden = false;
    }

    /* =========================================================
       TABLE
    ========================================================= */

    function renderTable(rows) {
        if (!elements.tableBody) {
            return;
        }

        if (!rows.length) {
            elements.tableBody.innerHTML = `
                <tr class="leaderboard-state-row">
                    <td colspan="6">
                        No completed quiz records are
                        available for this period yet.
                    </td>
                </tr>
            `;

            return;
        }

        elements.tableBody.innerHTML = "";

        rows.forEach(row => {
            const profile =
                state.profiles.get(
                    String(row.id)
                ) || {};

            const tr =
                document.createElement(
                    "tr"
                );

            tr.dataset.profileId =
                String(row.id || "");

            const rankCell =
                createRankCell(
                    row.rank
                );

            const studentCell =
                createStudentCell(
                    row,
                    profile
                );

            const admissionCell =
                createTextCell(
                    firstAvailable(
                        profile.admission_number
                    ) || "—",
                    "admission-cell"
                );

            const classCell =
                createClassCell(
                    firstAvailable(
                        profile.class_level,
                        row.class_level
                    )
                );

            const schoolCell =
                createTextCell(
                    firstAvailable(
                        profile.school_name,
                        row.school_name
                    ) || "—",
                    "school-cell"
                );

            const scoreCell =
                createScoreCell(
                    row.total_points
                );

            tr.append(
                rankCell,
                studentCell,
                admissionCell,
                classCell,
                schoolCell,
                scoreCell
            );

            elements.tableBody.appendChild(
                tr
            );
        });
    }

    function createRankCell(rank) {
        const td =
            document.createElement(
                "td"
            );

        td.className =
            "rank-cell";

        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            "rank-number";

        badge.textContent =
            Number.isFinite(
                Number(rank)
            )
                ? Number(rank)
                : "—";

        td.appendChild(badge);

        return td;
    }

    function createStudentCell(
        row,
        profile
    ) {
        const td =
            document.createElement(
                "td"
            );

        const wrapper =
            document.createElement(
                "div"
            );

        wrapper.className =
            "student-cell";

        const avatar =
            document.createElement(
                "img"
            );

        avatar.className =
            "student-avatar";

        avatar.src =
            profile.avatar_url ||
            CONFIG.fallbackAvatar;

        avatar.alt =
            `${firstAvailable(
                profile.full_name,
                row.full_name
            ) || "Student"} profile photo`;

        avatar.loading =
            "lazy";

        avatar.addEventListener(
            "error",
            () => {
                if (
                    avatar.src !==
                    CONFIG.fallbackAvatar
                ) {
                    avatar.src =
                        CONFIG.fallbackAvatar;
                }
            },
            { once: true }
        );

        const identity =
            document.createElement(
                "div"
            );

        identity.className =
            "student-identity";

        const name =
            document.createElement(
                "strong"
            );

        name.textContent =
            firstAvailable(
                profile.full_name,
                row.full_name
            ) || "Student";

        const location =
            document.createElement(
                "span"
            );

        location.textContent =
            formatLocation(
                profile
            ) ||
            profile.country ||
            "";

        identity.append(
            name,
            location
        );

        wrapper.append(
            avatar,
            identity
        );

        td.appendChild(
            wrapper
        );

        return td;
    }

    function createTextCell(
        text,
        className
    ) {
        const td =
            document.createElement(
                "td"
            );

        td.className =
            className;

        td.textContent =
            text || "—";

        return td;
    }

    function createClassCell(
        classLevel
    ) {
        const td =
            document.createElement(
                "td"
            );

        td.className =
            "class-cell";

        const badge =
            document.createElement(
                "span"
            );

        badge.className =
            `class-badge ${classBadgeClass(
                classLevel
            )}`;

        badge.textContent =
            classLevel || "—";

        td.appendChild(
            badge
        );

        return td;
    }

    function createScoreCell(
        points
    ) {
        const td =
            document.createElement(
                "td"
            );

        td.className =
            "score-cell";

        const strong =
            document.createElement(
                "strong"
            );

        const icon =
            document.createElement(
                "i"
            );

        icon.className =
            "fa-solid fa-star";

        icon.setAttribute(
            "aria-hidden",
            "true"
        );

        strong.appendChild(
            icon
        );

        strong.appendChild(
            document.createTextNode(
                ` ${formatNumber(
                    toNumber(points)
                )} pts`
            )
        );

        td.appendChild(
            strong
        );

        return td;
    }

    /* =========================================================
       STATS
    ========================================================= */

    function renderStats(
        stats
    ) {
        setText(
            "stat-students-value",
            formatStat(
                stats.students
            )
        );

        setText(
            "stat-schools-value",
            formatStat(
                stats.schools
            )
        );

        setText(
            "stat-quizzes-value",
            formatStat(
                stats.quizzes
            )
        );

        setText(
            "stat-accuracy-value",
            Number.isFinite(
                Number(
                    stats.accuracy
                )
            )
                ? `${Number(
                    stats.accuracy
                ).toFixed(1)}%`
                : "—"
        );
    }

    /* =========================================================
       PERIOD TABS
    ========================================================= */

    function bindPeriodTabs() {
        elements.periodTabs.forEach(
            tab => {
                tab.addEventListener(
                    "click",
                    async () => {
                        const requested =
                            tab.dataset.period;

                        const mapped =
                            CONFIG.periodMap[
                                requested
                            ];

                        if (!mapped) {
                            return;
                        }

                        if (
                            state.period ===
                                mapped &&
                            !state.loading
                        ) {
                            return;
                        }

                        state.period =
                            mapped;

                        updateActivePeriodTab(
                            requested
                        );

                        await loadLeaderboard();
                    }
                );
            }
        );
    }

    function updateActivePeriodTab(
        periodKey
    ) {
        elements.periodTabs.forEach(
            tab => {
                const active =
                    tab.dataset.period ===
                    periodKey;

                tab.classList.toggle(
                    "period-tab-active",
                    active
                );

                tab.setAttribute(
                    "aria-selected",
                    String(active)
                );
            }
        );
    }

    /* =========================================================
       MOBILE NAVIGATION
    ========================================================= */

    function bindMobileNavigation() {
        if (
            !elements.mobileMenuButton ||
            !elements.navActions
        ) {
            return;
        }

        elements.mobileMenuButton.addEventListener(
            "click",
            () => {
                const open =
                    elements.navActions
                        .classList
                        .toggle(
                            "is-open"
                        );

                elements.mobileMenuButton.setAttribute(
                    "aria-expanded",
                    String(open)
                );
            }
        );

        elements.navActions
            .querySelectorAll("a")
            .forEach(
                link => {
                    link.addEventListener(
                        "click",
                        () => {
                            elements.navActions
                                .classList
                                .remove(
                                    "is-open"
                                );

                            elements.mobileMenuButton
                                .setAttribute(
                                    "aria-expanded",
                                    "false"
                                );
                        }
                    );
                }
            );

        document.addEventListener(
            "click",
            event => {
                if (
                    !elements.navActions
                        .classList
                        .contains(
                            "is-open"
                        )
                ) {
                    return;
                }

                if (
                    elements.navActions.contains(
                        event.target
                    ) ||
                    elements.mobileMenuButton.contains(
                        event.target
                    )
                ) {
                    return;
                }

                elements.navActions
                    .classList
                    .remove(
                        "is-open"
                    );

                elements.mobileMenuButton
                    .setAttribute(
                        "aria-expanded",
                        "false"
                    );
            }
        );
    }

    /* =========================================================
       NOTIFICATIONS
    ========================================================= */

    function resetNotificationBadge() {
        if (
            !elements.notificationCount
        ) {
            return;
        }

        elements.notificationCount.textContent =
            "";

        elements.notificationCount.hidden =
            true;

        if (
            elements.notificationButton
        ) {
            elements.notificationButton.setAttribute(
                "aria-label",
                "Notifications"
            );
        }
            }
  /* =========================================================
       UI STATES
    ========================================================= */

    function setTableLoading() {
        if (
            !elements.tableBody
        ) {
            return;
        }

        elements.tableBody.innerHTML = `
            <tr class="leaderboard-state-row">
                <td colspan="6">
                    <span
                        class="leaderboard-loading"
                        aria-live="polite">
                        Loading leaderboard…
                    </span>
                </td>
            </tr>
        `;
    }

    function renderTableError(
        message
    ) {
        if (
            !elements.tableBody
        ) {
            return;
        }

        elements.tableBody.innerHTML =
            "";

        const row =
            document.createElement(
                "tr"
            );

        row.className =
            "leaderboard-state-row";

        const cell =
            document.createElement(
                "td"
            );

        cell.colSpan = 6;
        cell.textContent =
            message;

        row.appendChild(
            cell
        );

        elements.tableBody.appendChild(
            row
        );

        [1, 2, 3].forEach(
            rank => {
                const card =
                    document.getElementById(
                        `podium-${rankName(
                            rank
                        )}`
                    );

                if (card) {
                    card.hidden =
                        true;
                }
            }
        );

        renderStats({
            students: null,
            schools: null,
            quizzes: null,
            accuracy: null
        });
    }

    /* =========================================================
       PODIUM HELPERS
    ========================================================= */

    function renderAvatar(
        imageId,
        placeholderId,
        url,
        fullName
    ) {
        const image =
            document.getElementById(
                imageId
            );

        const placeholder =
            document.getElementById(
                placeholderId
            );

        if (
            !image ||
            !placeholder
        ) {
            return;
        }

        if (url) {
            image.src = url;

            image.alt =
                `${fullName} profile photo`;

            image.hidden =
                false;

            placeholder.hidden =
                true;

            image.onerror =
                () => {
                    image.hidden =
                        true;

                    placeholder.hidden =
                        false;
                };

            return;
        }

        image.hidden =
            true;

        placeholder.hidden =
            false;
    }

    function renderLocation(
        id,
        location
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        const span =
            element.querySelector(
                "span"
            );

        if (!span) {
            return;
        }

        span.textContent =
            location ||
            "Location not provided";
    }

    function renderCountry(
        id,
        country
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        if (!country) {
            element.textContent =
                "";

            element.hidden =
                true;

            return;
        }

        const flag =
            countryFlag(
                country
            );

        element.textContent =
            flag
                ? `${flag} ${country}`
                : country;

        element.hidden =
            false;
    }

    function renderPodiumScoreIcon(
        id
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        if (
            !element.querySelector(
                ".fa-star"
            )
        ) {
            const icon =
                document.createElement(
                    "i"
                );

            icon.className =
                "fa-solid fa-star";

            icon.setAttribute(
                "aria-hidden",
                "true"
            );

            element.prepend(
                icon
            );
        }
    }

    /* =========================================================
       DATE HELPERS
    ========================================================= */

    function currentDateString() {
        return formatDate(
            new Date()
        );
    }

    function startOfWeekDateString() {
        const date =
            new Date();

        const day =
            date.getDay();

        const diff =
            day === 0
                ? -6
                : 1 - day;

        date.setDate(
            date.getDate() + diff
        );

        return formatDate(
            date
        );
    }

    function startOfMonthDateString() {
        const date =
            new Date();

        date.setDate(1);

        return formatDate(
            date
        );
    }

    function formatDate(
        date
    ) {
        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(2, "0");

        const day =
            String(
                date.getDate()
            ).padStart(2, "0");

        return `${year}-${month}-${day}`;
    }

    /* =========================================================
       FORMATTERS
    ========================================================= */

    function formatNumber(
        value
    ) {
        const number =
            Number(value);

        if (
            !Number.isFinite(
                number
            )
        ) {
            return "0";
        }

        return new Intl.NumberFormat(
            "en-US",
            {
                maximumFractionDigits: 0
            }
        ).format(number);
    }

    function formatStat(
        value
    ) {
        if (
            value === null ||
            value === undefined ||
            !Number.isFinite(
                Number(value)
            )
        ) {
            return "—";
        }

        return formatNumber(
            value
        );
    }

    function formatLocation(
        profile
    ) {
        if (!profile) {
            return "";
        }

        return [
            profile.city,
            profile.state
        ]
            .map(
                normalizeText
            )
            .filter(Boolean)
            .join(", ");
    }

    function classBadgeClass(
        classLevel
    ) {
        const value =
            normalizeText(
                classLevel
            ).toLowerCase();

        if (
            value.includes(
                "primary"
            )
        ) {
            return "class-badge-green";
        }

        if (
            value.includes(
                "jss"
            )
        ) {
            return "class-badge-purple";
        }

        if (
            value.includes(
                "sss"
            )
        ) {
            return "class-badge-blue";
        }

        return "";
    }

    function countryFlag(
        country
    ) {
        const key =
            normalizeText(
                country
            ).toLowerCase();

        const flags = {
            nigeria: "🇳🇬",
            ghana: "🇬🇭",
            kenya: "🇰🇪",
            "south africa": "🇿🇦",
            senegal: "🇸🇳",
            egypt: "🇪🇬",
            "burkina faso": "🇧🇫",
            "united states": "🇺🇸",
            usa: "🇺🇸",
            "united kingdom": "🇬🇧",
            uk: "🇬🇧",
            canada: "🇨🇦",
            india: "🇮🇳"
        };

        return flags[key] ||
            "";
    }

    function rankName(
        rank
    ) {
        return {
            1: "first",
            2: "second",
            3: "third"
        }[rank];
    }

    function firstAvailable(
        ...values
    ) {
        return values.find(
            value =>
                value !== null &&
                value !== undefined &&
                String(
                    value
                ).trim() !== ""
        );
    }

    function normalizeText(
        value
    ) {
        return value === null ||
            value === undefined
            ? ""
            : String(
                value
            ).trim();
    }

    function toNumber(
        value
    ) {
        const number =
            Number(value);

        return Number.isFinite(
            number
        )
            ? number
            : 0;
    }

    function setText(
        id,
        value,
        preserveIcon = false
    ) {
        const element =
            document.getElementById(
                id
            );

        if (!element) {
            return;
        }

        if (preserveIcon) {
            const icon =
                element.querySelector(
                    ".fa-star"
                );

            element.textContent =
                "";

            if (icon) {
                element.appendChild(
                    icon
                );
            }

            element.appendChild(
                document.createTextNode(
                    value ?? ""
                )
            );

            return;
        }

        element.textContent =
            value ?? "";
    }

    /* =========================================================
       FOOTER
    ========================================================= */

    function renderFooterYear() {
        if (
            !elements.footerYear
        ) {
            return;
        }

        elements.footerYear.textContent =
            String(
                new Date()
                    .getFullYear()
            );
          }
  /* =========================================================
       INITIALIZATION
    ========================================================= */

    async function initialize() {
        cacheElements();

        renderFooterYear();

        resetNotificationBadge();

        bindPeriodTabs();

        bindMobileNavigation();

        updateActivePeriodTab(
            "all-time"
        );

        await loadLeaderboard();
    }

    /*
     * Small public API for testing/debugging.
     */
    window.FreumiaLeaderboardV2 =
        Object.freeze({
            reload:
                loadLeaderboard,

            getState: () => ({
                period:
                    state.period,

                rows:
                    [...state.rows],

                loading:
                    state.loading
            })
        });

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            initialize,
            {
                once: true
            }
        );
    } else {
        initialize();
    }

})();
          
