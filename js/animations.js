(function () {
  "use strict";

  // ─── Paleta editorial compartida ──────────────────────────
  // Una sola firma de movimiento atraviesa todo el sitio: easings y
  // tempos consistentes, variaciones solo donde la sección lo pide.
  const EASE = "expo.out";
  const EASE_DRAW = "power3.inOut";
  const EASE_POP = "back.out(2)";
  const D_HEAD = 1.2;
  const D_BODY = 1.0;
  const D_ACCENT = 0.7;
  const BEAT = 0.07;

  let lenis = null;

  // ─── Smooth scroll · Lenis ────────────────────────────────
  function initLenis() {
    if (typeof Lenis === "undefined") {
      console.warn("Lenis not loaded — using native scroll.");
      return;
    }

    lenis = new Lenis({
      duration: 1.4,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
      smoothTouch: false,
    });

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", (e) => {
        const id = link.getAttribute("href").slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0, duration: 1.6 });
      });
    });
  }

  // ─── Hero · cinematic intro + scroll parallax ────────────
  function initHeroAnimations() {
    if (!document.querySelector("#hero")) return;

    const intro = gsap.timeline({ defaults: { ease: EASE } });
    intro
      .from(".hero__title", { y: 80, opacity: 0, duration: 1.6 })
      .from(".hero__tagline", { y: 20, opacity: 0, duration: 1.0 }, "-=0.8");

    gsap.to(".hero__title", {
      y: -80,
      opacity: 0.15,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    gsap.to(".hero__tagline", {
      y: -40,
      opacity: 0,
      ease: "none",
      scrollTrigger: {
        trigger: "#hero",
        start: "top top",
        end: "bottom 30%",
        scrub: 1,
      },
    });
  }

  // ─── Servicios placeholder · subtle fade ─────────────────
  function initServiciosAnimations() {
    if (!document.querySelector("#servicios")) return;
    gsap.from(["#servicios .servicios__title", "#servicios .servicios__note"], {
      y: 30,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.15,
      scrollTrigger: { trigger: "#servicios", start: "top 75%" },
    });
  }

  // ─── Curvaturas · reveal grid + SVG path draw ────────────
  // El path-draw del SVG es la firma visual: cada curva "se dibuja"
  // a sí misma al entrar, reforzando el concepto de la sección.
  function initCurvaturasAnimations() {
    if (!document.querySelector("#curvaturas")) return;

    gsap.from(".curvaturas__title", {
      y: 50,
      opacity: 0,
      duration: D_HEAD,
      ease: EASE,
      scrollTrigger: { trigger: "#curvaturas", start: "top 80%" },
    });

    gsap.from(".curvaturas__subtitle, .curvaturas__divider", {
      y: 20,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.12,
      scrollTrigger: { trigger: "#curvaturas", start: "top 75%" },
    });

    gsap.from(".curvatura-card", {
      y: 80,
      opacity: 0,
      duration: 1.1,
      ease: EASE,
      stagger: BEAT,
      scrollTrigger: { trigger: "#curvaturas", start: "top 65%" },
    });

    gsap.utils.toArray(".curvatura-card__svg path").forEach((path) => {
      const length = path.getTotalLength ? path.getTotalLength() : 220;
      gsap.set(path, {
        strokeDasharray: length,
        strokeDashoffset: length,
      });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: EASE_DRAW,
        scrollTrigger: {
          trigger: path.closest(".curvatura-card"),
          start: "top 85%",
        },
      });
    });
  }

  // ─── Grosores · vertical pulse + lateral effect cards ────
  function initGrosoresAnimations() {
    if (!document.querySelector("#grosores")) return;

    gsap.from(".grosores__title", {
      y: 50,
      opacity: 0,
      duration: D_HEAD,
      ease: EASE,
      scrollTrigger: { trigger: "#grosores", start: "top 80%" },
    });

    gsap.from(".grosores__subtitle", {
      y: 20,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      scrollTrigger: { trigger: "#grosores", start: "top 78%" },
    });

    gsap.from(".grosor-item__bar", {
      scaleY: 0,
      opacity: 0,
      transformOrigin: "bottom center",
      duration: D_BODY,
      ease: EASE,
      stagger: 0.06,
      scrollTrigger: { trigger: ".grosores__scale", start: "top 80%" },
    });

    gsap.from(".grosor-item__value, .grosor-item__category", {
      y: 12,
      opacity: 0,
      duration: 0.7,
      ease: EASE,
      stagger: 0.04,
      scrollTrigger: { trigger: ".grosores__scale", start: "top 72%" },
    });

    gsap.from(".grosores__separator", {
      scaleX: 0.4,
      opacity: 0,
      transformOrigin: "center center",
      duration: 1.4,
      ease: EASE,
      scrollTrigger: { trigger: ".grosores__separator", start: "top 85%" },
    });

    gsap.from(".efecto-card", {
      x: -40,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: ".efectos-grid", start: "top 80%" },
    });

    gsap.from(".efecto-card__ordinal", {
      x: 40,
      opacity: 0,
      duration: 1.4,
      ease: "power3.out",
      stagger: 0.1,
      scrollTrigger: { trigger: ".efectos-grid", start: "top 75%" },
    });
  }

  // ─── Longitudes · horizontal draw + dot pop ──────────────
  function initLongitudesAnimations() {
    if (!document.querySelector("#longitudes")) return;

    gsap.from(".longitudes__title", {
      y: 50,
      opacity: 0,
      duration: D_HEAD,
      ease: EASE,
      scrollTrigger: { trigger: "#longitudes", start: "top 80%" },
    });

    gsap.from(".longitudes__subtitle", {
      y: 20,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      scrollTrigger: { trigger: "#longitudes", start: "top 78%" },
    });

    gsap.from(".longitud-row__bar", {
      width: 0,
      duration: 0.9,
      ease: EASE,
      stagger: 0.05,
      scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" },
    });

    gsap.from(".longitud-row__dot", {
      scale: 0,
      duration: 0.5,
      ease: EASE_POP,
      stagger: 0.05,
      delay: 0.7,
      scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" },
    });

    gsap.from(".longitud-row__value, .longitud-row__range", {
      opacity: 0,
      x: -12,
      duration: 0.6,
      ease: EASE,
      stagger: 0.03,
      scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" },
    });

    gsap.from(".longitudes__guide-title", {
      y: 40,
      opacity: 0,
      duration: D_HEAD,
      ease: EASE,
      scrollTrigger: { trigger: ".longitudes__guide", start: "top 85%" },
    });

    gsap.from(".perfil", {
      y: 50,
      opacity: 0,
      duration: D_HEAD,
      ease: EASE,
      stagger: 0.15,
      scrollTrigger: { trigger: ".longitudes__perfiles", start: "top 85%" },
    });
  }

  // ─── Productos · staircase + Roman numeral drift parallax ─
  // Los números romanos hacen un drift continuo con el scroll para
  // que el bloque se sienta vivo a lo largo de toda la sección.
  function initProductosAnimations() {
    if (!document.querySelector("#productos")) return;

    gsap.from(".productos__title, .productos__subtitle", {
      y: 40,
      opacity: 0,
      duration: 1.1,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: "#productos", start: "top 80%" },
    });

    document.querySelectorAll(".productos__category").forEach((cat) => {
      gsap.from(cat.querySelector(".productos__category-head"), {
        x: -50,
        opacity: 0,
        duration: D_BODY,
        ease: EASE,
        scrollTrigger: { trigger: cat, start: "top 80%" },
      });

      const roman = cat.querySelector(".productos__category-roman");
      if (roman) {
        gsap.fromTo(
          roman,
          { opacity: 0, x: -20 },
          {
            opacity: 0.3,
            x: 0,
            duration: 1.8,
            ease: EASE,
            scrollTrigger: { trigger: cat, start: "top 85%" },
          }
        );
        gsap.to(roman, {
          y: -40,
          ease: "none",
          scrollTrigger: {
            trigger: cat,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.2,
          },
        });
      }

      gsap.from(cat.querySelectorAll(".producto"), {
        y: 40,
        opacity: 0,
        duration: 0.9,
        ease: EASE,
        stagger: 0.08,
        scrollTrigger: { trigger: cat, start: "top 75%" },
      });
    });

    gsap.from(".productos__cta > *", {
      y: 30,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.12,
      scrollTrigger: { trigger: ".productos__cta", start: "top 85%" },
    });
  }

  // ─── Booking · two-column reveal + CTA punch ─────────────
  function initBookingAnimations() {
    if (!document.querySelector("#booking")) return;

    const trigger = { trigger: "#booking", start: "top 80%" };

    gsap.from(".booking__intro", {
      x: -40,
      opacity: 0,
      duration: 1.0,
      ease: EASE,
      scrollTrigger: trigger,
    });

    gsap.from(".booking__info", {
      x: 40,
      opacity: 0,
      duration: 1.0,
      ease: EASE,
      delay: 0.15,
      scrollTrigger: trigger,
    });

    gsap.from(".booking__cta", {
      y: 20,
      opacity: 0,
      duration: 0.8,
      ease: EASE,
      delay: 0.4,
      scrollTrigger: trigger,
    });
  }

  // ─── Header · hide on scroll-down, show on scroll-up ─────
  function initHeaderAnimations() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    let lastY = 0;
    ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => {
        const y = self.scroll();
        if (y < 60) {
          gsap.to(header, { y: 0, duration: 0.4, ease: EASE });
        } else if (y > lastY) {
          gsap.to(header, { y: -100, duration: 0.4, ease: EASE });
        } else {
          gsap.to(header, { y: 0, duration: 0.4, ease: EASE });
        }
        lastY = y;
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

    initLenis();

    initHeroAnimations();
    initServiciosAnimations();
    initCurvaturasAnimations();
    initGrosoresAnimations();
    initLongitudesAnimations();
    initProductosAnimations();
    initBookingAnimations();
    initHeaderAnimations();

    // Re-medir tras fuentes para que las posiciones sean exactas.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => ScrollTrigger.refresh());
    } else {
      ScrollTrigger.refresh();
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
