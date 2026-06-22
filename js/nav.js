const header = document.querySelector(".site-header");
const menuToggle = document.querySelector(".menu-toggle");
const mobileLinks = document.querySelectorAll(".mobile-menu a");

function syncHeader() {
  header?.classList.toggle("is-scrolled", window.scrollY > 60);
}

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

menuToggle?.addEventListener("click", () => {
  const isOpen = header.classList.toggle("menu-open");
  document.body.classList.toggle("no-scroll", isOpen);
  menuToggle.setAttribute("aria-expanded", String(isOpen));
});

mobileLinks.forEach((link) => {
  link.addEventListener("click", () => {
    header.classList.remove("menu-open");
    document.body.classList.remove("no-scroll");
    menuToggle?.setAttribute("aria-expanded", "false");
  });
});
