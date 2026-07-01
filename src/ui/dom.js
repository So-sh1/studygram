export const $ = selector => document.querySelector(selector);
export const $$ = selector => [...document.querySelectorAll(selector)];

export function setScreen(screenName) {
  $$("[data-screen]").forEach(screen => {
    screen.classList.toggle("active", screen.dataset.screen === screenName);
  });

  $$(".nav-btn").forEach(button => {
    button.classList.toggle("active", button.dataset.target === screenName);
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

export function showToast(message) {
  const old = document.querySelector(".toast");
  if (old) old.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  Object.assign(toast.style, {
    position: "fixed",
    left: "50%",
    bottom: "104px",
    transform: "translateX(-50%)",
    maxWidth: "calc(100% - 32px)",
    padding: "12px 16px",
    borderRadius: "999px",
    background: "rgba(0,0,0,.72)",
    color: "white",
    fontWeight: "900",
    zIndex: "9999",
    backdropFilter: "blur(12px)"
  });

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}
