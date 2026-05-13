(function () {
  "use strict";

  function initCurvaturasAnimations() {
    if (!document.querySelector("#curvaturas")) return;

    gsap.from(".curvaturas__title", {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: "expo.out",
      scrollTrigger: {
        trigger: "#curvaturas",
        start: "top 80%",
      },
    });

    gsap.from(".curvaturas__subtitle, .curvaturas__divider", {
      y: 20,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.1,
      scrollTrigger: {
        trigger: "#curvaturas",
        start: "top 78%",
      },
    });

    gsap.from(".curvatura-card", {
      y: 60,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.07,
      scrollTrigger: {
        trigger: "#curvaturas",
        start: "top 70%",
      },
    });
  }

  function init() {
    if (typeof gsap === "undefined") {
      console.warn("GSAP not loaded — animations skipped.");
      return;
    }
    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    initCurvaturasAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
