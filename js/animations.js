/**
 * Lash Studio BJ · animations.js
 * ES2023+ vanilla JS sin dependencias propias (GSAP + Lenis vía CDN).
 * Las funciones init* se llaman desde init() al cargar el documento.
 */
(() => {
  "use strict";

  // ─── Paleta editorial compartida ──────────────────────────
  // Una sola firma de movimiento atraviesa todo el sitio: easings y
  // tempos consistentes, variaciones sólo donde la sección lo pide.
  const EASE = "expo.out";
  const EASE_DRAW = "power3.inOut";
  const EASE_POP = "back.out(2)";
  const D_HEAD = 1.2;
  const D_BODY = 1.0;
  const BEAT = 0.07;

  const PREFERS_REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SUPPORTS_HOVER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  let lenis = null;

  // ─── Preloader · exit luego de fonts + raf inicial ───────
  function initPreloader() {
    const pre = document.querySelector(".preloader");
    if (!pre) return;

    const exit = () => {
      gsap.to(pre, {
        opacity: 0,
        duration: 0.7,
        ease: EASE,
        delay: 0.4,
        onComplete: () => pre.classList.add("is-gone"),
      });
    };

    if (PREFERS_REDUCED) {
      exit();
      return;
    }

    // Anima el monograma drawing antes de salir.
    const paths = pre.querySelectorAll(".preloader__mark path");
    paths.forEach((p) => {
      const len = p.getTotalLength?.() ?? 400;
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
    });

    gsap.timeline({ onComplete: exit })
      .to(paths, { strokeDashoffset: 0, duration: 1.4, ease: EASE_DRAW, stagger: 0.15 }, 0)
      .to(".preloader__count", { opacity: 0, duration: 0.4 }, "-=0.3");
  }

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

  // ─── Cursor custom · quickTo para 60fps ──────────────────
  function initCursor() {
    if (!SUPPORTS_HOVER || PREFERS_REDUCED) return;

    const cursor = document.querySelector(".cursor");
    const dot = cursor?.querySelector(".cursor__dot");
    const ring = cursor?.querySelector(".cursor__ring");
    if (!cursor || !dot || !ring) return;

    document.body.classList.add("has-custom-cursor");

    const setDotX = gsap.quickTo(dot, "x", { duration: 0.15, ease: "power3.out" });
    const setDotY = gsap.quickTo(dot, "y", { duration: 0.15, ease: "power3.out" });
    const setRingX = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const setRingY = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    window.addEventListener("pointermove", (e) => {
      setDotX(e.clientX);
      setDotY(e.clientY);
      setRingX(e.clientX);
      setRingY(e.clientY);
    }, { passive: true });

    // Estado hover sobre elementos interactivos
    const interactive = "a, button, [role='button'], summary, .magnetic, input, textarea, .comparador__stage";
    document.querySelectorAll(interactive).forEach((el) => {
      el.addEventListener("pointerenter", () => cursor.classList.add("is-hover"));
      el.addEventListener("pointerleave", () => cursor.classList.remove("is-hover"));
    });
  }

  // ─── Magnetic CTAs · el botón sigue al cursor sutilmente ──
  function initMagnetic() {
    if (!SUPPORTS_HOVER || PREFERS_REDUCED) return;

    document.querySelectorAll(".magnetic").forEach((el) => {
      const strength = 0.25;
      const reset = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" });
      const resetY = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" });

      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
        const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
        gsap.to(el, { x, y, duration: 0.4, ease: "power3.out" });
      });

      el.addEventListener("pointerleave", () => {
        reset(0);
        resetY(0);
      });
    });
  }

  // ─── Indicador de sección sticky · IntersectionObserver ──
  function initSectionNav() {
    const nav = document.querySelector(".section-nav");
    if (!nav) return;

    const items = nav.querySelectorAll(".section-nav__item");
    const sections = [...items]
      .map((item) => {
        const id = item.dataset.section;
        const target = document.getElementById(id);
        return target ? { item, target } : null;
      })
      .filter(Boolean);

    // Mostrar el nav después de scrollear más allá del hero
    ScrollTrigger.create({
      trigger: "#about",
      start: "top 80%",
      onEnter: () => nav.classList.add("is-visible"),
      onLeaveBack: () => nav.classList.remove("is-visible"),
    });

    const setActive = (active) => {
      sections.forEach(({ item, target }) => {
        item.classList.toggle("is-active", target === active);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target);
      },
      { threshold: [0.25, 0.5, 0.75], rootMargin: "-30% 0px -30% 0px" }
    );
    sections.forEach(({ target }) => observer.observe(target));
  }

  // ─── Comparador antes/después · slider input → --pos ─────
  function initComparador() {
    const stage = document.querySelector("[data-comparador]");
    if (!stage) return;
    const slider = stage.querySelector(".comparador__slider");
    if (!slider) return;

    const update = (value) => {
      stage.style.setProperty("--pos", `${value}%`);
    };

    slider.addEventListener("input", (e) => update(e.target.value));
    update(slider.value);

    // Entrada animada: handle barre de derecha a izquierda y se detiene en 50%
    if (!PREFERS_REDUCED) {
      gsap.fromTo(
        stage,
        { "--pos": "100%" },
        {
          "--pos": "50%",
          duration: 1.8,
          ease: EASE,
          scrollTrigger: { trigger: stage, start: "top 75%" },
          onUpdate() {
            const v = this.targets()[0].style.getPropertyValue("--pos");
            slider.value = parseFloat(v) || 50;
          },
        }
      );
    }
  }

  // ─── Stats · cuenta ascendente al entrar en viewport ─────
  function initStats() {
    const nums = document.querySelectorAll(".stat__num[data-target]");
    if (!nums.length) return;

    nums.forEach((el) => {
      const target = Number(el.dataset.target);
      if (!Number.isFinite(target)) return;

      const proxy = { value: 0 };
      gsap.to(proxy, {
        value: target,
        duration: 2.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: el,
          start: "top 85%",
          onEnter: () => { el.textContent = "0"; },
        },
        onUpdate() {
          el.textContent = Math.floor(proxy.value).toLocaleString("es-AR");
        },
        onComplete() {
          el.textContent = target.toLocaleString("es-AR");
        },
      });
    });
  }

  // ─── Hero · editorial intro timeline + BJ parallax ───────
  // Las líneas del título usan overflow:hidden en el wrapper y un
  // span interno que entra desde y:102% — efecto "type reveal" sin
  // SplitText. La secuencia es absoluta (posiciones en la timeline)
  // para respetar el ritmo del spec.
  function initHeroAnimations() {
    if (!document.querySelector("#hero")) return;

    const tl = gsap.timeline({ delay: 1.4, defaults: { ease: "expo.out" } });

    tl.from(".hero__eyebrow-word", { y: 15, opacity: 0, duration: 0.9, stagger: 0.04 }, 0)
      .from(".hero__line--1 .hero__line-inner", { yPercent: 102, duration: 1.4 }, 0.3)
      .from(".hero__line--2 .hero__line-inner", { yPercent: 102, duration: 1.4 }, 0.48)
      .from(".hero__sub", { y: 25, opacity: 0, duration: 1.0 }, 0.9)
      .from(".hero__cta", { y: 20, opacity: 0, duration: 0.9 }, 1.1)
      .from(".hero__scroll", { opacity: 0, duration: 1.2 }, 1.8);

    gsap.to(".hero-bg-text", {
      y: -120,
      ease: "none",
      scrollTrigger: { trigger: "#hero", start: "top top", end: "bottom top", scrub: 1.5 },
    });
  }

  // ─── Marquee · entrada (la animación CSS se ocupa del loop) ─
  function initMarqueeAnimations() {
    if (!document.querySelector(".marquee")) return;
    gsap.from(".marquee", {
      opacity: 0,
      y: 20,
      duration: D_BODY,
      ease: EASE,
      scrollTrigger: { trigger: ".marquee", start: "top 90%" },
    });
  }

  // ─── About · split reveal (visual + text columns) ────────
  function initAboutAnimations() {
    if (!document.querySelector("#about")) return;

    const visualTrigger = { trigger: "#about", start: "top 82%" };
    const textTrigger = { trigger: "#about .about-text", start: "top 85%" };

    gsap.from(".about-visual", { x: -50, opacity: 0, duration: 1.2, ease: EASE, scrollTrigger: visualTrigger });
    gsap.from(".about__frame", { scale: 0.8, opacity: 0, duration: 1.0, ease: EASE, delay: 0.2, scrollTrigger: visualTrigger });
    gsap.from([".about__eyebrow", ".about__title", ".about__paragraph"], { y: 30, opacity: 0, duration: 1.0, ease: EASE, stagger: 0.12, scrollTrigger: textTrigger });
    gsap.from(".about__pull", { x: -20, opacity: 0, duration: 1.0, ease: EASE, delay: 0.3, scrollTrigger: textTrigger });
    gsap.from(".about__cred", { x: 20, opacity: 0, duration: 0.8, ease: EASE, stagger: 0.08, scrollTrigger: textTrigger });
  }

  // ─── Carta · reveal escalonado de items ──────────────────
  function initCartaAnimations() {
    if (!document.querySelector("#servicios.carta")) return;

    gsap.from([".carta__eyebrow", ".carta__title", ".carta__sub"], {
      y: 30,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: "#servicios", start: "top 80%" },
    });

    gsap.from(".carta-item", {
      y: 40,
      opacity: 0,
      duration: 0.9,
      ease: EASE,
      stagger: 0.08,
      scrollTrigger: { trigger: ".carta__grid", start: "top 80%" },
    });

    gsap.from(".carta__footnote", {
      opacity: 0,
      duration: 1.0,
      ease: EASE,
      scrollTrigger: { trigger: ".carta__footnote", start: "top 92%" },
    });
  }

  // ─── Curvaturas · reveal grid + SVG path draw ────────────
  function initCurvaturasAnimations() {
    if (!document.querySelector("#curvaturas")) return;

    gsap.from(".curvaturas__title", { y: 50, opacity: 0, duration: D_HEAD, ease: EASE, scrollTrigger: { trigger: "#curvaturas", start: "top 80%" } });
    gsap.from(".curvaturas__subtitle, .curvaturas__divider", { y: 20, opacity: 0, duration: D_BODY, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: "#curvaturas", start: "top 75%" } });
    gsap.from(".curvatura-card", { y: 80, opacity: 0, duration: 1.1, ease: EASE, stagger: BEAT, scrollTrigger: { trigger: "#curvaturas", start: "top 65%" } });

    gsap.utils.toArray(".curvatura-card__svg path").forEach((path) => {
      const length = path.getTotalLength ? path.getTotalLength() : 220;
      gsap.set(path, { strokeDasharray: length, strokeDashoffset: length });
      gsap.to(path, {
        strokeDashoffset: 0,
        duration: 1.6,
        ease: EASE_DRAW,
        scrollTrigger: { trigger: path.closest(".curvatura-card"), start: "top 85%" },
      });
    });
  }

  // ─── Grosores · vertical pulse + lateral effect cards ────
  function initGrosoresAnimations() {
    if (!document.querySelector("#grosores")) return;

    gsap.from(".grosores__title", { y: 50, opacity: 0, duration: D_HEAD, ease: EASE, scrollTrigger: { trigger: "#grosores", start: "top 80%" } });
    gsap.from(".grosores__subtitle", { y: 20, opacity: 0, duration: D_BODY, ease: EASE, scrollTrigger: { trigger: "#grosores", start: "top 78%" } });
    gsap.from(".grosor-item__bar", { scaleY: 0, opacity: 0, transformOrigin: "bottom center", duration: D_BODY, ease: EASE, stagger: 0.06, scrollTrigger: { trigger: ".grosores__scale", start: "top 80%" } });
    gsap.from(".grosor-item__value, .grosor-item__category", { y: 12, opacity: 0, duration: 0.7, ease: EASE, stagger: 0.04, scrollTrigger: { trigger: ".grosores__scale", start: "top 72%" } });
    gsap.from(".grosores__separator", { scaleX: 0.4, opacity: 0, transformOrigin: "center center", duration: 1.4, ease: EASE, scrollTrigger: { trigger: ".grosores__separator", start: "top 85%" } });
    gsap.from(".efecto-card", { x: -40, opacity: 0, duration: D_BODY, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: ".efectos-grid", start: "top 80%" } });
    gsap.from(".efecto-card__ordinal", { x: 40, opacity: 0, duration: 1.4, ease: "power3.out", stagger: 0.1, scrollTrigger: { trigger: ".efectos-grid", start: "top 75%" } });
  }

  // ─── Longitudes · horizontal draw + dot pop ──────────────
  function initLongitudesAnimations() {
    if (!document.querySelector("#longitudes")) return;

    gsap.from(".longitudes__title", { y: 50, opacity: 0, duration: D_HEAD, ease: EASE, scrollTrigger: { trigger: "#longitudes", start: "top 80%" } });
    gsap.from(".longitudes__subtitle", { y: 20, opacity: 0, duration: D_BODY, ease: EASE, scrollTrigger: { trigger: "#longitudes", start: "top 78%" } });
    gsap.from(".longitud-row__bar", { width: 0, duration: 0.9, ease: EASE, stagger: 0.05, scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" } });
    gsap.from(".longitud-row__dot", { scale: 0, duration: 0.5, ease: EASE_POP, stagger: 0.05, delay: 0.7, scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" } });
    gsap.from(".longitud-row__value, .longitud-row__range", { opacity: 0, x: -12, duration: 0.6, ease: EASE, stagger: 0.03, scrollTrigger: { trigger: ".longitudes__chart", start: "top 80%" } });
    gsap.from(".longitudes__guide-title", { y: 40, opacity: 0, duration: D_HEAD, ease: EASE, scrollTrigger: { trigger: ".longitudes__guide", start: "top 85%" } });
    gsap.from(".perfil", { y: 50, opacity: 0, duration: D_HEAD, ease: EASE, stagger: 0.15, scrollTrigger: { trigger: ".longitudes__perfiles", start: "top 85%" } });
  }

  // ─── Productos · staircase + Roman numeral drift parallax ─
  function initProductosAnimations() {
    if (!document.querySelector("#productos")) return;

    gsap.from(".productos__title, .productos__subtitle", { y: 40, opacity: 0, duration: 1.1, ease: EASE, stagger: 0.1, scrollTrigger: { trigger: "#productos", start: "top 80%" } });

    document.querySelectorAll(".productos__category").forEach((cat) => {
      gsap.from(cat.querySelector(".productos__category-head"), { x: -50, opacity: 0, duration: D_BODY, ease: EASE, scrollTrigger: { trigger: cat, start: "top 80%" } });

      const roman = cat.querySelector(".productos__category-roman");
      if (roman) {
        gsap.fromTo(roman, { opacity: 0, x: -20 }, { opacity: 0.3, x: 0, duration: 1.8, ease: EASE, scrollTrigger: { trigger: cat, start: "top 85%" } });
        gsap.to(roman, { y: -40, ease: "none", scrollTrigger: { trigger: cat, start: "top bottom", end: "bottom top", scrub: 1.2 } });
      }

      gsap.from(cat.querySelectorAll(".producto"), { y: 40, opacity: 0, duration: 0.9, ease: EASE, stagger: 0.08, scrollTrigger: { trigger: cat, start: "top 75%" } });
    });

    gsap.from(".productos__cta > *", { y: 30, opacity: 0, duration: D_BODY, ease: EASE, stagger: 0.12, scrollTrigger: { trigger: ".productos__cta", start: "top 85%" } });
  }

  // ─── Testimonios · reveal asimétrico ─────────────────────
  function initTestimoniosAnimations() {
    if (!document.querySelector("#testimonios")) return;

    gsap.from([".testimonios__eyebrow", ".testimonios__title", ".testimonios__meta"], {
      y: 30,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: ".testimonios__header", start: "top 85%" },
    });

    gsap.from(".testimonio", {
      y: 50,
      opacity: 0,
      duration: 0.9,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: ".testimonios__grid", start: "top 80%" },
    });
  }

  // ─── FAQ · reveal de items ───────────────────────────────
  function initFAQAnimations() {
    if (!document.querySelector("#faq")) return;

    gsap.from([".faq__eyebrow", ".faq__title", ".faq__sub"], {
      y: 30,
      opacity: 0,
      duration: D_BODY,
      ease: EASE,
      stagger: 0.1,
      scrollTrigger: { trigger: ".faq__header", start: "top 85%" },
    });

    gsap.from(".faq-item", {
      y: 30,
      opacity: 0,
      duration: 0.7,
      ease: EASE,
      stagger: 0.06,
      scrollTrigger: { trigger: ".faq__list", start: "top 85%" },
    });
  }

  // ─── Booking · two-column reveal + CTA punch ─────────────
  function initBookingAnimations() {
    if (!document.querySelector("#booking")) return;

    const trigger = { trigger: "#booking", start: "top 80%" };

    gsap.from(".booking__intro", { x: -40, opacity: 0, duration: 1.0, ease: EASE, scrollTrigger: trigger });
    gsap.from(".booking__info", { x: 40, opacity: 0, duration: 1.0, ease: EASE, delay: 0.15, scrollTrigger: trigger });
    gsap.from(".booking__cta", { y: 20, opacity: 0, duration: 0.8, ease: EASE, delay: 0.4, scrollTrigger: trigger });
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
      // Aún así, sacar el preloader para que el contenido sea visible.
      document.querySelector(".preloader")?.classList.add("is-gone");
      return;
    }
    if (typeof ScrollTrigger !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    initPreloader();
    initLenis();
    initCursor();
    initMagnetic();
    initSectionNav();

    initHeroAnimations();
    initMarqueeAnimations();
    initAboutAnimations();
    initCartaAnimations();
    initCurvaturasAnimations();
    initGrosoresAnimations();
    initLongitudesAnimations();
    initStats();
    initProductosAnimations();
    initComparador();
    initTestimoniosAnimations();
    initFAQAnimations();
    initBookingAnimations();
    initHeaderAnimations();

    // Re-medir tras fuentes para que las posiciones sean exactas.
    if (document.fonts?.ready) {
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
