/* ==========================================================
   FREUMIA STUDENTS AI
   STUDY PLAN V2
   Real profile + quiz activity driven
========================================================== */

(() => {
    "use strict";

    /* ==========================================================
       STATE
    ========================================================== */

    const state = {
        session: null,
        profile: null,
        attempts: [],
        weeklyAttempts: [],
        planTasks: []
    };

    const els = {};

    /* ==========================================================
       SUBJECT STYLES
    ========================================================== */

    const SUBJECT_STYLES = {
        mathematics: {
            icon: "fa-square-root-variable",
            color: "blue"
        },

        science: {
            icon: "fa-flask",
            color: "green"
        },

        english: {
            icon: "fa-book-open",
            color: "orange"
        },

        "computer studies": {
            icon: "fa-display",
            color: "purple"
        },

        computer: {
            icon: "fa-display",
            color: "purple"
        },

        physics: {
            icon: "fa-atom",
            color: "blue"
        },

        chemistry: {
            icon: "fa-flask",
            color: "green"
        },

        biology: {
            icon: "fa-dna",
            color: "green"
        },

        default: {
            icon: "fa-book",
            color: "purple"
        }
    };

    /* ==========================================================
       CACHE DOM ELEMENTS
    ========================================================== */

    function cacheElements() {

        els.currentDate =
            document.getElementById("currentDate");

        els.studentClassMeta =
            document.getElementById("studentClassMeta");

        els.todayDate =
            document.getElementById("todayDate");

        els.planSubtitle =
            document.getElementById("planSubtitle");

        els.todayPlanList =
            document.getElementById("todayPlanList");

        els.startPlanButton =
            document.getElementById("startPlanButton");

        els.weeklyProgressLabel =
            document.getElementById("weeklyProgressLabel");

        els.weekDays =
            document.getElementById("weekDays");

        els.weeklyProgressBar =
            document.getElementById("weeklyProgressBar");

        els.weeklyProgressMessage =
            document.getElementById("weeklyProgressMessage");

        els.studyStreakValue =
            document.getElementById("studyStreakValue");

        els.hoursStudiedValue =
            document.getElementById("hoursStudiedValue");

        els.quizzesDoneValue =
            document.getElementById("quizzesDoneValue");

        els.averageScoreValue =
            document.getElementById("averageScoreValue");

        els.recommendationText =
            document.getElementById("recommendationText");

        els.recommendationSubjects =
            document.getElementById(
                "recommendationSubjects"
            );

        els.footerYear =
            document.getElementById("footerYear");

        els.mobileMenuButton =
            document.getElementById(
                "mobileMenuButton"
            );

        els.mobileNav =
            document.getElementById(
                "spv2MobileNav"
            );

        els.notificationButton =
            document.getElementById(
                "notificationButton"
            );

        els.notificationBadge =
            document.getElementById(
                "notificationBadge"
            );
    }

    /* ==========================================================
       INITIALIZATION
    ========================================================== */

    async function init() {

        cacheElements();

        renderStaticDate();

        bindMobileNavigation();

        bindNotificationButton();

        if (els.footerYear) {
            els.footerYear.textContent =
                String(new Date().getFullYear());
        }

        try {

            await waitForSupabase();

            const session =
                await getSession();

            if (!session) {

                redirectToLogin();

                return;
            }

            state.session = session;

            await loadStudentData();

        } catch (error) {

            console.error(
                "Study Plan V2 initialization failed:",
                error
            );

            renderPageError(
                "We could not load your study plan. Please refresh and try again."
            );
        }
    }

    /* ==========================================================
       SUPABASE
    ========================================================== */

    async function waitForSupabase() {

        const timeout = 8000;

        const started = Date.now();

        while (!window.supabaseClient) {

            if (
                Date.now() - started >
                timeout
            ) {
                throw new Error(
                    "Supabase client was not initialized."
                );
            }

            await delay(80);
        }
    }

    async function getSession() {

        const {
            data,
            error
        } =
            await window.supabaseClient.auth.getSession();

        if (error) {
            throw error;
        }

        return data?.session || null;
    }

    /* ==========================================================
       LOAD STUDENT DATA
    ========================================================== */

    async function loadStudentData() {

        const userId =
            state.session.user.id;

        /* ------------------------------------------------------
           PROFILE
        ------------------------------------------------------ */

        const profileResult =
            await window.supabaseClient
                .from("profiles")
                .select(`
                    id,
                    full_name,
                    school_name,
                    class_level,
                    country,
                    state,
                    city,
                    goal,
                    avatar_url,
                    current_quiz_streak,
                    longest_quiz_streak,
                    total_quizzes_completed,
                    total_quizzes,
                    total_points,
                    total_quiz_points,
                    average_quiz_accuracy,
                    average_score,
                    best_score,
                    last_quiz_date
                `)
                .eq("id", userId)
                .maybeSingle();

        if (profileResult.error) {
            throw profileResult.error;
        }

        state.profile =
            profileResult.data || null;

        /* ------------------------------------------------------
           QUIZ ATTEMPTS
        ------------------------------------------------------ */

        const attemptsResult =
            await window.supabaseClient
                .from("quiz_attempts")
                .select(`
                    id,
                    profile_id,
                    quiz_date,
                    quiz_day,
                    class_level,
                    subject,
                    questions_total,
                    correct_answers,
                    wrong_answers,
                    score_percentage,
                    points_earned,
                    quiz_duration_seconds,
                    started_at,
                    completed_at,
                    status
                `)
                .eq("profile_id", userId)
                .eq("status", "completed")
                .order(
                    "quiz_date",
                    {
                        ascending: false
                    }
                )
                .order(
                    "completed_at",
                    {
                        ascending: false
                    }
                )
                .limit(100);

        if (attemptsResult.error) {
            throw attemptsResult.error;
        }

        state.attempts =
            attemptsResult.data || [];

        state.weeklyAttempts =
            state.attempts.filter(
                attempt =>
                    isCurrentWeek(
                        attempt.quiz_date
                    )
            );

        /* ------------------------------------------------------
           RENDER
        ------------------------------------------------------ */

        renderStudentMeta();

        renderTodayPlan();

        renderWeeklyProgress();

        renderStats();

        renderRecommendation();
    }

    /* ==========================================================
       STATIC DATE
    ========================================================== */

    function renderStaticDate() {

        const today =
            new Date();

        const formatted =
            new Intl.DateTimeFormat(
                "en-US",
                {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                }
            ).format(today);

        if (els.currentDate) {

            els.currentDate.textContent =
                formatted;
        }

        if (els.todayDate) {

            els.todayDate.textContent =
                formatted;

            els.todayDate.dateTime =
                formatDate(today);
        }
    }

    /* ==========================================================
       STUDENT META
    ========================================================== */

    function renderStudentMeta() {

        if (!els.studentClassMeta) {
            return;
        }

        const classLevel =
            state.profile?.class_level;

        els.studentClassMeta.innerHTML = `
            <i class="fa-solid fa-graduation-cap"></i>

            <strong>
                ${escapeHtml(
                    classLevel || "Student"
                )}
            </strong>
        `;
    }

    /* ==========================================================
       BUILD TODAY'S PLAN
    ========================================================== */

    function buildPlanTasks() {

        const grouped =
            groupSubjectPerformance(
                state.attempts
            );

        /*
         * Subjects with the lowest scores are
         * placed first so the student focuses
         * on weaker areas.
         */

        const subjects =
            Object.values(grouped)
                .sort(
                    (a, b) =>
                        a.averageScore -
                        b.averageScore
                )
                .slice(0, 4);

        const tasks =
            subjects.map(
                (subject, index) => ({

                    type: "subject",

                    subject:
                        subject.name,

                    description:
                        `Review recent ${subject.name} quiz performance`,

                    duration:
                        [30, 25, 20, 20][index] ||
                        20,

                    completed:
                        false,

                    style:
                        subjectStyle(
                            subject.name
                        )
                })
            );

        /*
         * Daily Quiz
         */

        tasks.push({

            type: "quiz",

            subject:
                "Daily Quiz",

            description:
                "Complete your daily Freumia quiz",

            duration:
                15,

            completed:
                hasCompletedQuizToday(),

            style: {
                icon:
                    "fa-circle-question",

                color:
                    "pink"
            }
        });

        return tasks;
    }

    /* ==========================================================
       RENDER TODAY'S PLAN
    ========================================================== */

    function renderTodayPlan() {

        state.planTasks =
            buildPlanTasks();

        if (!els.todayPlanList) {
            return;
        }

        /*
         * No quiz history yet
         */

        if (!state.planTasks.length) {

            els.todayPlanList.innerHTML = `
                <div class="spv2-empty-row">
                    Complete your first quiz to unlock
                    a personalized study plan.
                </div>
            `;

            if (els.startPlanButton) {

                els.startPlanButton.disabled =
                    true;
            }

            return;
        }

        /*
         * Render tasks
         */

        els.todayPlanList.innerHTML =
            state.planTasks
                .map(
                    (task, index) =>
                        createTaskMarkup(
                            task,
                            index
                        )
                )
                .join("");

        if (els.planSubtitle) {

            els.planSubtitle.textContent =
                state.attempts.length
                    ? "Personalized from your real quiz activity"
                    : "Start learning to build your plan";
        }

        if (els.startPlanButton) {

            els.startPlanButton.disabled =
                false;

            els.startPlanButton.onclick =
                handleStartPlan;
        }
    }

    /* ==========================================================
       TASK MARKUP
    ========================================================== */

    function createTaskMarkup(
        task,
        index
    ) {

        const style =
            task.style ||
            SUBJECT_STYLES.default;

        const statusClass =
            task.completed
                ? "complete"
                : index === 0
                    ? "current"
                    : "";

        const statusIcon =
            task.completed
                ? "fa-check"
                : index === 0
                    ? "fa-circle"
                    : "";

        return `
            <article
                class="spv2-plan-row"
                data-plan-index="${index}"
            >

                <span
                    class="spv2-task-icon ${style.color}"
                >
                    <i
                        class="fa-solid ${style.icon}"
                    ></i>
                </span>

                <div class="spv2-task-copy">

                    <strong>
                        ${escapeHtml(
                            task.subject
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            task.description
                        )}
                    </span>

                </div>

                <span
                    class="spv2-task-duration"
                >
                    ${task.duration} min
                </span>

                <span
                    class="spv2-task-status ${statusClass}"
                    aria-label="${
                        task.completed
                            ? "Completed"
                            : "Not completed"
                    }"
                >
                    ${
                        statusIcon
                            ? `
                                <i
                                    class="fa-solid ${statusIcon}"
                                ></i>
                              `
                            : ""
                    }
                </span>

            </article>
        `;
    }

    /* ==========================================================
       START PLAN
    ========================================================== */

    function handleStartPlan() {

        const firstIncomplete =
            state.planTasks.find(
                task =>
                    !task.completed
            );

        /*
         * Everything completed
         */

        if (!firstIncomplete) {

            showMessage(
                "Today's plan is already completed."
            );

            return;
        }

        /*
         * Daily quiz
         */

        if (
            firstIncomplete.type ===
            "quiz"
        ) {

            window.location.href =
                "quizzes.html";

            return;
        }

        /*
         * Subject learning
         *
         * We do not create fake database
         * completion records because the
         * current database does not have
         * a persisted study-plan task table.
         */

        window.location.href =
            `quizzes.html?subject=${encodeURIComponent(
                firstIncomplete.subject
            )}`;
    }

    /* ==========================================================
       WEEKLY PROGRESS
    ========================================================== */

    function renderWeeklyProgress() {

        if (!els.weekDays) {
            return;
        }

        const today =
            new Date();

        const monday =
            startOfWeek(today);

        /*
         * One completed date = one completed
         * learning day.
         */

        const completedDates =
            new Set(
                state.weeklyAttempts
                    .map(
                        attempt =>
                            attempt.quiz_date
                    )
                    .filter(Boolean)
            );

        const days = [];

        for (
            let index = 0;
            index < 7;
            index++
        ) {

            const date =
                new Date(monday);

            date.setDate(
                monday.getDate() +
                index
            );

            const dateString =
                formatDate(date);

            const complete =
                completedDates.has(
                    dateString
                );

            const isToday =
                dateString ===
                formatDate(today);

            days.push({

                date,

                dateString,

                complete,

                isToday
            });
        }

        const completedCount =
            days.filter(
                day =>
                    day.complete
            ).length;

        const percentage =
            Math.round(
                (completedCount / 7) *
                100
            );

        els.weekDays.innerHTML =
            days
                .map(
                    day => `

                        <div
                            class="
                                spv2-week-day
                                ${day.complete ? "complete" : ""}
                                ${day.isToday ? "today" : ""}
                            "
                        >

                            <span
                                class="spv2-week-day-name"
                            >
                                ${new Intl.DateTimeFormat(
                                    "en-US",
                                    {
                                        weekday:
                                            "short"
                                    }
                                ).format(
                                    day.date
                                )}
                            </span>

                            <span
                                class="spv2-week-day-dot"
                            title="${day.dateString}"
                            >
                                ${
                                    day.complete
                                        ? `
                                            <i
                                                class="fa-solid fa-check"
                                            ></i>
                                          `
                                        : day.isToday
                                            ? `
                                                <i
                                                    class="
                                                        fa-solid
                                                        fa-circle
                                                    "
                                                ></i>
                                              `
                                            : ""
                                }
                            </span>

                        </div>

                    `
                )
                .join("");

        /*
         * Label
         */

        els.weeklyProgressLabel.textContent =
            `${completedCount} of 7 Days`;

        /*
         * Progress bar
         */

        els.weeklyProgressBar.style.width =
            `${percentage}%`;

        /*
         * Message
         */

        if (completedCount === 7) {

            els.weeklyProgressMessage.textContent =
                "Excellent. You completed the full week! 🏆";

        } else if (completedCount >= 4) {

            els.weeklyProgressMessage.textContent =
                "Great consistency. Keep pushing! 💪";

        } else if (completedCount > 0) {

            els.weeklyProgressMessage.textContent =
                "Keep going. Consistency is the key 💪";

        } else {

            els.weeklyProgressMessage.textContent =
                "Start your first learning day this week 🚀";
        }
    }

    /* ==========================================================
       STATS
    ========================================================== */

    function renderStats() {

        /*
         * Current streak
         */

        const streak =
            Number(
                state.profile?.current_quiz_streak
            );

        /*
         * Hours studied
         *
         * Based on quiz_duration_seconds
         */

        const hours =
            state.weeklyAttempts.reduce(
                (
                    total,
                    attempt
                ) => {

                    return (
                        total +
                        (
                            Number(
                                attempt
                                    .quiz_duration_seconds
                            ) || 0
                        )
                    );

                },
                0
            ) / 3600;

        /*
         * Weekly quizzes
         */

        const quizzes =
            state.weeklyAttempts.length;

        /*
         * Weekly average
         */

        const average =
            calculateAverage(
                state.weeklyAttempts.map(
                    attempt =>
                        Number(
                            attempt
                                .score_percentage
                        )
                )
            );

        /*
         * Study streak
         */

        if (els.studyStreakValue) {

            els.studyStreakValue.textContent =
                Number.isFinite(streak)
                    ? formatNumber(streak)
                    : "—";
        }

        /*
         * Hours
         */

        if (els.hoursStudiedValue) {

            els.hoursStudiedValue.textContent =
                hours > 0
                    ? hours.toFixed(1)
                    : "0";
        }

        /*
         * Quizzes
         */

        if (els.quizzesDoneValue) {

            els.quizzesDoneValue.textContent =
                formatNumber(quizzes);
        }

        /*
         * Average score
         */

        if (els.averageScoreValue) {

            els.averageScoreValue.textContent =
                Number.isFinite(average)
                    ? `${average.toFixed(0)}%`
                    : "—";
        }
    }

    /* ==========================================================
       AI RECOMMENDATION
    ========================================================== */

    function renderRecommendation() {

        const grouped =
            groupSubjectPerformance(
                state.attempts
            );

        /*
         * Lowest-performing subjects first
         */

        const subjects =
            Object.values(grouped)
                .sort(
                    (a, b) =>
                        a.averageScore -
                        b.averageScore
                )
                .slice(0, 2);

        if (!els.recommendationText) {
            return;
        }

        /*
         * No history
         */

        if (!subjects.length) {

            els.recommendationText.textContent =
                "Complete a quiz and Freumia will use your real performance to recommend what to focus on next.";

            if (
                els.recommendationSubjects
            ) {

                els.recommendationSubjects
                    .innerHTML = "";
            }

            return;
        }

        const subjectNames =
            subjects.map(
                subject =>
                    subject.name
            );

        /*
         * One weak subject
         */

        if (subjects.length === 1) {

            els.recommendationText.innerHTML =
                `
                    Based on your recent quiz
                    performance, you should focus
                    more on
                    <strong>
                        ${escapeHtml(
                            subjectNames[0]
                        )}
                    </strong>
                    this week.
                `;

        }

        /*
         * Two weak subjects
         */

        else {

            els.recommendationText.innerHTML =
                `
                    Based on your recent quiz
                    performance, you should focus
                    more on
                    <strong>
                        ${escapeHtml(
                            subjectNames[0]
                        )}
                    </strong>
                    and
                    <strong>
                        ${escapeHtml(
                            subjectNames[1]
                        )}
                    </strong>
                    this week.
                `;
        }

        /*
         * Subject score tags
         */

        if (
            els.recommendationSubjects
        ) {

            els.recommendationSubjects.innerHTML =
                subjects
                    .map(
                        subject => `

                            <span
                                class="
                                    spv2-recommendation-tag
                                "
                            >
                                ${escapeHtml(
                                    subject.name
                                )}
                                ·
                                ${subject.averageScore.toFixed(
                                    0
                                )}%
                            </span>

                        `
                    )
                    .join("");
        }
    }

    /* ==========================================================
       GROUP SUBJECT PERFORMANCE
    ========================================================== */

    function groupSubjectPerformance(
        attempts
    ) {

        const grouped = {};

        attempts.forEach(
            attempt => {

                const name =
                    normalizeSubject(
                        attempt.subject
                    );

                if (!name) {
                    return;
                }

                if (!grouped[name]) {

                    grouped[name] = {

                        name,

                        scores: [],

                        attempts: 0
                    };
                }

                const score =
                    Number(
                        attempt
                            .score_percentage
                    );

                if (
                    Number.isFinite(
                        score
                    )
                ) {

                    grouped[name]
                        .scores
                        .push(score);
                }

                grouped[name]
                    .attempts++;
            }
        );

        /*
         * Calculate average score
         */

        Object.values(grouped)
            .forEach(
                subject => {

                    subject.averageScore =
                        calculateAverage(
                            subject.scores
                        ) || 0;
                }
            );

        return grouped;
    }

    /* ==========================================================
       SUBJECT STYLE
    ========================================================== */

    function subjectStyle(
        subject
    ) {

        const key =
            normalizeSubject(
                subject
            ).toLowerCase();

        return (
            SUBJECT_STYLES[key] ||
            SUBJECT_STYLES.default
        );
    }

    /* ==========================================================
       NORMALIZE SUBJECT
    ========================================================== */

    function normalizeSubject(
        value
    ) {

        return String(
            value || ""
        ).trim();
    }

    /* ==========================================================
       CHECK TODAY'S QUIZ
    ========================================================== */

    function hasCompletedQuizToday() {

        const today =
            formatDate(
                new Date()
            );

        return state.attempts.some(
            attempt =>
                attempt.quiz_date ===
                today
        );
    }

    /* ==========================================================
       CURRENT WEEK
    ========================================================== */

    function isCurrentWeek(
        dateString
    ) {

        if (!dateString) {
            return false;
        }

        const date =
            parseDate(
                dateString
            );

        const start =
            startOfWeek(
                new Date()
            );

        const end =
            new Date(start);

        end.setDate(
            start.getDate() + 7
        );

        return (
            date >= start &&
            date < end
        );
    }

    /* ==========================================================
       START OF WEEK
       Monday = first day
    ========================================================== */

    function startOfWeek(
        date
    ) {

        const result =
            new Date(date);

        result.setHours(
            0,
            0,
            0,
            0
        );

        const day =
            result.getDay();

        const diff =
            day === 0
                ? -6
                : 1 - day;

        result.setDate(
            result.getDate() +
            diff
        );

        return result;
    }

    /* ==========================================================
       PARSE DATE
    ========================================================== */

    function parseDate(
        value
    ) {

        const parts =
            String(value)
                .split("-")
                .map(Number);

        return new Date(
            parts[0],
            parts[1] - 1,
            parts[2]
        );
    }

    /* ==========================================================
       FORMAT DATE
    ========================================================== */

    function formatDate(
        date
    ) {

        const year =
            date.getFullYear();

        const month =
            String(
                date.getMonth() + 1
            ).padStart(
                2,
                "0"
            );

        const day =
            String(
                date.getDate()
            ).padStart(
                2,
                "0"
            );

        return (
            `${year}-${month}-${day}`
        );
    }

    /* ==========================================================
       MOBILE NAVIGATION
    ========================================================== */

    function bindMobileNavigation() {

        if (
            !els.mobileMenuButton ||
            !els.mobileNav
        ) {
            return;
        }

        els.mobileMenuButton.addEventListener(
            "click",
            () => {

                const open =
                    els.mobileNav.hidden;

                els.mobileNav.hidden =
                    !open;

                els.mobileMenuButton
                    .setAttribute(
                        "aria-expanded",
                        String(open)
                    );

                els.mobileMenuButton.innerHTML =
                    open
                        ? `
                            <i
                                class="
                                    fa-solid
                                    fa-xmark
                                "
                            ></i>
                          `
                        : `
                            <i
                                class="
                                    fa-solid
                                    fa-bars
                                "
                            ></i>
                          `;
            }
        );

        els.mobileNav
            .querySelectorAll("a")
            .forEach(
                link => {

                    link.addEventListener(
                        "click",
                        () => {

                            els.mobileNav.hidden =
                                true;

                            els.mobileMenuButton
                                .setAttribute(
                                    "aria-expanded",
                                    "false"
                                );

                            els.mobileMenuButton
                                .innerHTML =
                                `
                                    <i
                                        class="
                                            fa-solid
                                            fa-bars
                                        "
                                    ></i>
                                `;
                        }
                    );
                }
            );
    }

    /* ==========================================================
       NOTIFICATION
    ========================================================== */
  function bindNotificationButton() {

        if (
            !els.notificationButton
        ) {
            return;
        }

        els.notificationButton
            .addEventListener(
                "click",
                () => {

                    showMessage(
                        "You have no new notifications."
                    );
                }
            );
    }

    /* ==========================================================
       REDIRECT
    ========================================================== */

    function redirectToLogin() {

        window.location.href =
            "auth-page.html";
    }

    /* ==========================================================
       PAGE ERROR
    ========================================================== */

    function renderPageError(
        message
    ) {

        if (els.todayPlanList) {

            els.todayPlanList.innerHTML =
                `
                    <div
                        class="spv2-empty-row"
                    >
                        ${escapeHtml(
                            message
                        )}
                    </div>
                `;
        }

        if (
            els.recommendationText
        ) {

            els.recommendationText
                .textContent =
                message;
        }
    }

    /* ==========================================================
       USER MESSAGE
    ========================================================== */

    function showMessage(
        message
    ) {

        window.alert(
            message
        );
    }

    /* ==========================================================
       CALCULATE AVERAGE
    ========================================================== */

    function calculateAverage(
        values
    ) {

        const valid =
            values.filter(
                value =>
                    Number.isFinite(
                        Number(value)
                    )
            );

        if (!valid.length) {
            return null;
        }

        return (
            valid.reduce(
                (
                    sum,
                    value
                ) =>
                    sum +
                    Number(value),
                0
            ) /
            valid.length
        );
    }

    /* ==========================================================
       FORMAT NUMBER
    ========================================================== */

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
            return "—";
        }

        return new Intl.NumberFormat(
            "en-US"
        ).format(
            number
        );
    }

    /* ==========================================================
       DELAY
    ========================================================== */

    function delay(
        milliseconds
    ) {

        return new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    milliseconds
                )
        );
    }

    /* ==========================================================
       ESCAPE HTML
    ========================================================== */

    function escapeHtml(
        value
    ) {

        return String(
            value ?? ""
        )
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

    /* ==========================================================
       PUBLIC DEBUG API
    ========================================================== */

    window.FreumiaStudyPlanV2 =
        Object.freeze({

            reload:
                loadStudentData,

            getState:
                () => ({

                    profile:
                        state.profile,

                    attempts:
                        [
                            ...state.attempts
                        ],

                    weeklyAttempts:
                        [
                            ...state.weeklyAttempts
                        ],

                    planTasks:
                        [
                            ...state.planTasks
                        ]
                })
        });

    /* ==========================================================
       START APPLICATION
    ========================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init,
            {
                once: true
            }
        );

    } else {

        init();
    }

})();
  
                                
