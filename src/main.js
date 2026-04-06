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
  const forceSolid =
    document.body.classList.contains("page-work") || document.body.classList.contains("page-about");
  nav.classList.toggle("nav--solid", forceSolid || window.scrollY > 48);
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
const contactFormMain = document.getElementById("contactFormMain");
const submitBtn = document.getElementById("submitBtn");
const submitLabel = document.getElementById("submitLabel");
const contactFeedback = document.getElementById("contactFeedback");
const contactFeedbackMsg = document.getElementById("contactFeedbackMsg");
const contactsUrl = import.meta.env.VITE_CONTACTS_WEB_APP_URL?.trim() || "";
const formSecret = import.meta.env.VITE_CONTACT_FORM_SECRET?.trim() || "";

/** Basic format check (form uses novalidate, so we validate in JS). */
function isValidEmailFormat(value) {
  const v = value.trim();
  if (!v) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function clearContactFeedback() {
  if (!contactFeedback || !contactFeedbackMsg || !form) return;
  contactFeedback.hidden = true;
  contactFeedbackMsg.textContent = "";
  contactFeedback.className = "contact__feedback";
  form.dataset.formState = "idle";
}

/** @param {"success"|"error"|"info"} tone */
function showContactFeedback(message, tone) {
  if (!contactFeedback || !contactFeedbackMsg || !form) return;
  contactFeedback.hidden = false;
  contactFeedbackMsg.textContent = message;
  contactFeedback.className = `contact__feedback contact__feedback--${tone}`;
  if (tone === "error") form.dataset.formState = "error";
  else form.dataset.formState = "idle";
}

function showContactSuccess(message) {
  if (!contactFeedback || !contactFeedbackMsg || !form) return;
  form.reset();
  form.dataset.formState = "success";
  if (contactFormMain) contactFormMain.setAttribute("aria-hidden", "true");
  contactFeedback.hidden = false;
  contactFeedbackMsg.textContent = message;
  contactFeedback.className = "contact__feedback contact__feedback--success contact__feedback--full";
  contactFeedback.focus();
}

if (form && submitBtn && submitLabel) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fd = new FormData(form);
    if ((fd.get("website") || "").toString().trim() !== "") {
      return;
    }

    if (!contactsUrl) {
      submitBtn.disabled = true;
      submitLabel.textContent = "Not configured";
      showContactFeedback(
        "This form is not connected yet. Add VITE_CONTACTS_WEB_APP_URL for production, or use the email in the sidebar.",
        "info",
      );
      window.setTimeout(() => {
        submitLabel.textContent = "Send message";
        submitBtn.disabled = false;
        clearContactFeedback();
      }, 5000);
      return;
    }

    const name = (fd.get("name") || "").toString().trim();
    const email = (fd.get("email") || "").toString().trim();
    const message = (fd.get("message") || "").toString().trim();

    if (!name || !email || !message) {
      showContactFeedback("Please fill in your name, email, and message so we can reply.", "error");
      window.setTimeout(() => clearContactFeedback(), 4500);
      return;
    }

    if (!isValidEmailFormat(email)) {
      showContactFeedback("Please enter a valid email address (e.g. name@example.com).", "error");
      document.getElementById("femail")?.focus();
      window.setTimeout(() => clearContactFeedback(), 4500);
      return;
    }

    const type = (fd.get("type") || "").toString().trim();
    const payload = {
      name,
      email,
      type,
      message,
      website: (fd.get("website") || "").toString(),
      ...(formSecret ? { secret: formSecret } : {}),
    };

    submitBtn.disabled = true;
    submitLabel.textContent = "Sending…";

    try {
      // Google Apps Script web apps do not send CORS headers for JSON POSTs (preflight fails).
      // text/plain + no-cors avoids preflight; the script still receives JSON in e.postData.contents.
      await fetch(contactsUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });
      submitLabel.textContent = "Send message";
      submitBtn.disabled = false;
      showContactSuccess(
        "Thanks — we received your message. We will follow up at the email you provided when we can.",
      );
    } catch {
      submitLabel.textContent = "Try again";
      showContactFeedback(
        "Something went wrong sending from this browser. Please email us directly using the address on the right.",
        "error",
      );
      window.setTimeout(() => {
        submitLabel.textContent = "Send message";
        submitBtn.disabled = false;
        clearContactFeedback();
      }, 6000);
    }
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
