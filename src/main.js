import "./style.css";

const nav = document.getElementById("nav");
const menuBtn = document.getElementById("menuBtn");
const menuOverlay = document.getElementById("menuOverlay");
const menuClose = document.getElementById("menuClose");
const menuLinks = document.querySelectorAll(".menu-link");

function openMenu() {
  menuOverlay.classList.add("is-open");
  menuOverlay.setAttribute("aria-hidden", "false");
  menuBtn.setAttribute("aria-expanded", "true");
  nav.classList.add("nav--open");
  document.body.style.overflow = "hidden";
  menuClose.focus();
}

function closeMenu() {
  menuOverlay.classList.remove("is-open");
  menuOverlay.setAttribute("aria-hidden", "true");
  menuBtn.setAttribute("aria-expanded", "false");
  nav.classList.remove("nav--open");
  document.body.style.overflow = "";
  menuBtn.focus();
}

menuBtn.addEventListener("click", () => {
  if (menuOverlay.classList.contains("is-open")) {
    closeMenu();
  } else {
    openMenu();
  }
});
menuClose.addEventListener("click", closeMenu);
menuOverlay.addEventListener("click", (e) => {
  if (e.target === menuOverlay) {
    closeMenu();
  }
});
menuLinks.forEach((link) => link.addEventListener("click", closeMenu));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && menuOverlay.classList.contains("is-open")) {
    closeMenu();
  }
});

function updateNavSolid() {
  nav.classList.toggle("nav--solid", window.scrollY > 48);
}

window.addEventListener("scroll", updateNavSolid, { passive: true });
updateNavSolid();

const fadeUps = document.querySelectorAll(".fade-up");
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        io.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: "0px 0px -32px 0px" },
);
fadeUps.forEach((el) => io.observe(el));

const form = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = document.getElementById("submitLabel");
if (form && submitBtn && submitLabel) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    submitBtn.disabled = true;
    submitLabel.textContent = "Sending…";
    window.setTimeout(() => {
      submitLabel.textContent = "Sent";
      form.reset();
      window.setTimeout(() => {
        submitLabel.textContent = "Send message";
        submitBtn.disabled = false;
      }, 2800);
    }, 1200);
  });
}

const yearEl = document.getElementById("year");
if (yearEl) {
  yearEl.textContent = String(new Date().getFullYear());
}

/** Horizontal drift on the CTA image grid: scroll → subtle right-to-left motion */
const ctaScrollTrack = document.getElementById("ctaScrollTrack");
const ctaReadyStrip = document.getElementById("ctaReadyStrip");

function updateCtaScrollParallax() {
  if (!ctaScrollTrack || !ctaReadyStrip) return;
  const y = window.scrollY;
  const vh = window.innerHeight;
  const local = Math.max(0, y - ctaReadyStrip.offsetTop + vh);
  const x = -(local * 0.14);
  ctaScrollTrack.style.transform = `translate3d(${x}px, 0, 0)`;
}

let ctaScrollRaf = 0;
function onScrollCtaParallax() {
  if (ctaScrollRaf) return;
  ctaScrollRaf = requestAnimationFrame(() => {
    ctaScrollRaf = 0;
    updateCtaScrollParallax();
  });
}

window.addEventListener("scroll", onScrollCtaParallax, { passive: true });
window.addEventListener("resize", onScrollCtaParallax, { passive: true });
updateCtaScrollParallax();
