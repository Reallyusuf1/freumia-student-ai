// ======================================
// Navigation V2 Module
// ======================================

const menuToggle = document.querySelector(".menu-toggle");
const mobileSidebar = document.querySelector(".mobile-sidebar");
const menuOverlay = document.querySelector(".menu-overlay");

function activateSidebar() {
    mobileSidebar.classList.add("active");
    mobileSidebar.scrollTop = 0;
}

function activateOverlay() {
    menuOverlay.classList.add("active");
}

function activateNavigationState() {

    // Lock page scrolling while the navigation is open.
    // This function must NOT control Hero, Sidebar, or Overlay behavior.

    document.body.classList.add("menu-open");
}

function openSidebar() {
    activateSidebar();
    activateOverlay();
    activateNavigationState();
}
function deactivateSidebar() {
    mobileSidebar.classList.remove("active");
}

function deactivateOverlay() {
    menuOverlay.classList.remove("active");
}

function deactivateNavigationState() {

    // Restore page scrolling after the navigation closes.

    document.body.classList.remove("menu-open");
}

function closeSidebar() {
    deactivateSidebar();
    deactivateOverlay();
    deactivateNavigationState();
}

function toggleSidebar() {
    mobileSidebar.classList.contains("active")
        ? closeSidebar()
        : openSidebar();
}

function initializeNavigation() {

    if (!menuToggle || !mobileSidebar || !menuOverlay) return;

    menuToggle.addEventListener("click", toggleSidebar);
    mobileSidebar.addEventListener("touchmove", (e) => {
    e.stopPropagation();
 } );

    menuOverlay.addEventListener("click", closeSidebar);

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });
}

document.addEventListener("DOMContentLoaded", initializeNavigation);
