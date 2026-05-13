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

  function initGrosoresAnimations() {
    if (!document.querySelector("#grosores")) return;

    gsap.from(".grosores__title", {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: "expo.out",
      scrollTrigger: {
        trigger: "#grosores",
        start: "top 80%",
      },
    });

    gsap.from(".grosor-item__bar", {
      scaleY: 0,
      opacity: 0,
      transformOrigin: "bottom center",
      duration: 0.8,
      ease: "expo.out",
      stagger: 0.05,
      scrollTrigger: {
        trigger: ".grosores__scale",
        start: "top 80%",
      },
    });

    gsap.from(".grosor-item__value, .grosor-item__category", {
      y: 10,
      opacity: 0,
      duration: 0.6,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: {
        trigger: ".grosores__scale",
        start: "top 75%",
      },
    });

    gsap.from(".grosores__separator", {
      opacity: 0,
      duration: 0.8,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".grosores__separator",
        start: "top 85%",
      },
    });

    gsap.from(".efecto-card", {
      x: -30,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: {
        trigger: ".efectos-grid",
        start: "top 80%",
      },
    });
  }

  function initLongitudesAnimations() {
    if (!document.querySelector("#longitudes")) return;

    gsap.from(".longitudes__title", {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: "expo.out",
      scrollTrigger: {
        trigger: "#longitudes",
        start: "top 80%",
      },
    });

    gsap.from(".longitud-row__bar", {
      width: 0,
      duration: 0.6,
      ease: "expo.out",
      stagger: 0.04,
      scrollTrigger: {
        trigger: ".longitudes__chart",
        start: "top 80%",
      },
    });

    gsap.from(".longitud-row__dot", {
      scale: 0,
      duration: 0.4,
      ease: "back.out(2)",
      stagger: 0.04,
      delay: 0.6,
      scrollTrigger: {
        trigger: ".longitudes__chart",
        start: "top 80%",
      },
    });

    gsap.from(".longitud-row__value, .longitud-row__range", {
      opacity: 0,
      x: -10,
      duration: 0.5,
      ease: "expo.out",
      stagger: 0.03,
      scrollTrigger: {
        trigger: ".longitudes__chart",
        start: "top 80%",
      },
    });

    gsap.from(".longitudes__guide-title", {
      y: 30,
      opacity: 0,
      duration: 0.9,
      ease: "expo.out",
      scrollTrigger: {
        trigger: ".longitudes__guide",
        start: "top 85%",
      },
    });

    gsap.from(".perfil", {
      y: 40,
      opacity: 0,
      duration: 1.0,
      ease: "expo.out",
      stagger: 0.12,
      scrollTrigger: {
        trigger: ".longitudes__perfiles",
        start: "top 85%",
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
    initGrosoresAnimations();
    initLongitudesAnimations();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
