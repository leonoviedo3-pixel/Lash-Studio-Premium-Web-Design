/**
 * E2E test suite · Lash Studio BJ
 *
 * Cubre los flujos críticos del sitio:
 *   1. Carga y SEO (title, meta tags, JSON-LD)
 *   2. Navegación interna y section-nav sticky
 *   3. Carta de servicios y links de WhatsApp
 *   4. Comparador antes/después interactivo
 *   5. FAQ accordion (semántico <details>)
 *   6. Stats animados con cuenta ascendente
 *   7. Responsive (desktop, tablet, mobile)
 *
 * Para correr:
 *   python3 -m http.server 8000 &
 *   node tests/e2e.mjs
 *
 * Requisitos: Node 18+, Playwright instalado globalmente o vía npm.
 * Si Playwright no está en node_modules, ajustar el import path.
 */

import pw from '/opt/node22/lib/node_modules/playwright/index.js';
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = pw;
const BASE_URL = process.env.BASE_URL ?? 'http://localhost:8000/index.html';
const ARTIFACTS = '/tmp/e2e-artifacts';
fs.mkdirSync(ARTIFACTS, { recursive: true });

/** @typedef {{name: string, fn: (page: import('playwright').Page) => Promise<void>, viewport?: {width: number, height: number}}} Test */

/** @type {{passed: string[], failed: {name: string, error: string}[]}} */
const results = { passed: [], failed: [] };

/**
 * Aserción minimalista: tira si el valor es falsy.
 * @param {unknown} cond
 * @param {string} msg
 * @returns {void}
 */
function expect(cond, msg) {
  if (!cond) throw new Error(`Assertion failed: ${msg}`);
}

/** @type {Test[]} */
const tests = [
  // ───────────────────────────────────────────────────────
  //  1. SEO y metadata crítica
  // ───────────────────────────────────────────────────────
  {
    name: 'SEO · title, description, OG tags y JSON-LD presentes',
    async fn(page) {
      await page.goto(BASE_URL);
      const title = await page.title();
      expect(title.includes('Lash Studio BJ'), `title debería incluir "Lash Studio BJ", got "${title}"`);

      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      expect(desc && desc.length > 50, 'meta description vacía o muy corta');

      const og = await page.locator('meta[property="og:title"]').getAttribute('content');
      expect(og, 'falta meta og:title');

      const jsonLd = await page.locator('script[type="application/ld+json"]').textContent();
      expect(jsonLd, 'falta JSON-LD');
      const parsed = JSON.parse(jsonLd);
      expect(parsed['@type'] === 'BeautySalon', 'JSON-LD @type debe ser BeautySalon');
      expect(parsed.telephone?.includes('3549'), 'JSON-LD telephone incorrecto');
    },
  },

  // ───────────────────────────────────────────────────────
  //  2. Navegación interna (header + section-nav)
  // ───────────────────────────────────────────────────────
  {
    name: 'Navegación · click en "Carta" del header lleva a #servicios',
    async fn(page) {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000); // espera preloader
      await page.locator('.site-header__nav a[href="#servicios"]').click();
      await page.waitForTimeout(2500); // Lenis duration 1.6s + buffer
      const result = await page.evaluate(() => {
        const el = document.getElementById('servicios');
        if (!el) return { ok: false, top: null };
        const r = el.getBoundingClientRect();
        return { ok: r.top >= -200 && r.top <= window.innerHeight * 0.4, top: Math.round(r.top) };
      });
      expect(result.ok, `sección Carta no quedó cerca del top (top=${result.top}px)`);
    },
  },

  {
    name: 'Section-nav sticky aparece después del hero',
    viewport: { width: 1440, height: 900 },
    async fn(page) {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      const hiddenAtTop = await page.evaluate(() => {
        const nav = document.querySelector('.section-nav');
        return nav && !nav.classList.contains('is-visible');
      });
      expect(hiddenAtTop, 'section-nav debería estar oculta en el hero');

      await page.evaluate(() => window.scrollTo(0, window.innerHeight * 2));
      await page.waitForTimeout(800);
      const visibleAfterScroll = await page.evaluate(() => {
        const nav = document.querySelector('.section-nav');
        return nav?.classList.contains('is-visible');
      });
      expect(visibleAfterScroll, 'section-nav debería ser visible después de scrollear');
    },
  },

  // ───────────────────────────────────────────────────────
  //  3. Carta y WhatsApp
  // ───────────────────────────────────────────────────────
  {
    name: 'Carta · 10 servicios renderizados y todos linkean a WhatsApp',
    async fn(page) {
      await page.goto(BASE_URL);
      const items = await page.locator('.carta-item').count();
      expect(items === 10, `esperaba 10 items en carta, encontré ${items}`);

      const ctas = page.locator('.carta-item__cta');
      const count = await ctas.count();
      for (let i = 0; i < count; i++) {
        const href = await ctas.nth(i).getAttribute('href');
        expect(href?.startsWith('https://wa.me/543549632202'), `CTA carta ${i} no apunta a WhatsApp: ${href}`);
        expect(href?.includes('text='), `CTA carta ${i} sin texto pre-rellenado`);
      }
    },
  },

  {
    name: 'Hero · CTA "Reservá tu turno" apunta a WhatsApp con texto',
    async fn(page) {
      await page.goto(BASE_URL);
      const href = await page.locator('.hero__cta').getAttribute('href');
      expect(href?.startsWith('https://wa.me/543549632202'), 'hero CTA no apunta a WhatsApp');
      expect(href?.includes('reservar'), 'hero CTA sin "reservar" en el texto pre-rellenado');
    },
  },

  // ───────────────────────────────────────────────────────
  //  4. Comparador antes/después
  // ───────────────────────────────────────────────────────
  {
    name: 'Comparador · slider modifica --pos al arrastrar',
    viewport: { width: 1440, height: 900 },
    async fn(page) {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3000);
      await page.evaluate(() => document.getElementById('comparador')?.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(1500);

      const initialPos = await page.evaluate(() =>
        document.querySelector('.comparador__stage')?.style.getPropertyValue('--pos')
      );
      expect(initialPos, 'comparador no tiene --pos inicial');

      // Mover el slider (input range) al 20%
      const slider = page.locator('.comparador__slider');
      await slider.evaluate((el) => {
        el.value = '20';
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      await page.waitForTimeout(300);

      const newPos = await page.evaluate(() =>
        document.querySelector('.comparador__stage')?.style.getPropertyValue('--pos')
      );
      expect(newPos?.includes('20'), `--pos no se actualizó a 20%, sigue en ${newPos}`);
    },
  },

  // ───────────────────────────────────────────────────────
  //  5. FAQ accordion
  // ───────────────────────────────────────────────────────
  {
    name: 'FAQ · click en pregunta abre el <details>',
    async fn(page) {
      await page.goto(BASE_URL);
      await page.evaluate(() => document.getElementById('faq')?.scrollIntoView({ block: 'start' }));
      await page.waitForTimeout(800);

      const firstFaq = page.locator('.faq-item').first();
      const openedBefore = await firstFaq.evaluate((el) => el.hasAttribute('open'));
      expect(!openedBefore, 'FAQ debería estar cerrado al inicio');

      await firstFaq.locator('summary').click();
      await page.waitForTimeout(200);

      const openedAfter = await firstFaq.evaluate((el) => el.hasAttribute('open'));
      expect(openedAfter, 'FAQ no se abrió tras click en summary');
    },
  },

  {
    name: 'FAQ · 8 preguntas presentes, todas con respuesta',
    async fn(page) {
      await page.goto(BASE_URL);
      const count = await page.locator('.faq-item').count();
      expect(count === 8, `esperaba 8 preguntas en FAQ, encontré ${count}`);
      const answers = await page.locator('.faq-item__answer').count();
      expect(answers === 8, `esperaba 8 respuestas, encontré ${answers}`);
    },
  },

  // ───────────────────────────────────────────────────────
  //  6. Stats animados
  // ───────────────────────────────────────────────────────
  {
    name: 'Stats · 4 métricas con cuenta ascendente al entrar en viewport',
    async fn(page) {
      await page.goto(BASE_URL);
      const stats = await page.locator('.stat__num').count();
      expect(stats === 4, `esperaba 4 stats, encontré ${stats}`);

      // Scroll hasta stats
      await page.evaluate(() => document.getElementById('stats')?.scrollIntoView({ block: 'center' }));
      await page.waitForTimeout(3000); // espera animación completa

      // Verificar que los valores finales se renderizaron (con formato es-AR)
      const values = await page.locator('.stat__num').allTextContents();
      expect(values[0].includes('3') && values[0].length >= 4, `stat 1 (clientas) no llegó a 3.000: ${values[0]}`);
      expect(values[1] === '7', `stat 2 (años) debería ser 7, es ${values[1]}`);
      expect(values[2] === '4', `stat 3 (semanas) debería ser 4, es ${values[2]}`);
      expect(values[3] === '50', `stat 4 (productos) debería ser 50, es ${values[3]}`);
    },
  },

  // ───────────────────────────────────────────────────────
  //  7. Responsive: mobile no muestra section-nav, oculta header nav
  // ───────────────────────────────────────────────────────
  {
    name: 'Mobile · header nav y section-nav escondidos',
    viewport: { width: 390, height: 844 },
    async fn(page) {
      await page.goto(BASE_URL);
      const headerNavHidden = await page.locator('.site-header__nav').evaluate(
        (el) => window.getComputedStyle(el).display === 'none'
      );
      expect(headerNavHidden, 'header nav debería estar oculto en mobile');

      const sectionNavHidden = await page.locator('.section-nav').evaluate(
        (el) => window.getComputedStyle(el).display === 'none'
      );
      expect(sectionNavHidden, 'section-nav debería estar oculta en mobile');
    },
  },

  {
    name: 'Mobile · carta colapsa a 1 columna',
    viewport: { width: 390, height: 844 },
    async fn(page) {
      await page.goto(BASE_URL);
      const cols = await page.locator('.carta__grid').evaluate(
        (el) => window.getComputedStyle(el).gridTemplateColumns.split(' ').length
      );
      expect(cols === 1, `esperaba 1 columna en mobile, encontré ${cols}`);
    },
  },

  // ───────────────────────────────────────────────────────
  //  8. Accesibilidad básica
  // ───────────────────────────────────────────────────────
  {
    name: 'A11y · lang="es" y todas las imágenes/svg decorativos tienen aria-hidden',
    async fn(page) {
      await page.goto(BASE_URL);
      const lang = await page.locator('html').getAttribute('lang');
      expect(lang === 'es', `html lang debería ser "es", es "${lang}"`);

      // Verifica que los SVGs sin texto visible (decorativos) tengan aria-hidden o aria-label
      const orphanSvgs = await page.locator('svg:not([aria-hidden]):not([aria-label]):not([role="img"])').count();
      expect(orphanSvgs === 0, `${orphanSvgs} SVGs sin aria-hidden ni aria-label`);
    },
  },

  // ───────────────────────────────────────────────────────
  //  9. Preloader sale del DOM
  // ───────────────────────────────────────────────────────
  {
    name: 'Preloader · obtiene clase is-gone al terminar la intro',
    async fn(page) {
      await page.goto(BASE_URL);
      await page.waitForTimeout(3500);
      const isGone = await page.locator('.preloader').evaluate((el) => el.classList.contains('is-gone'));
      expect(isGone, 'preloader no recibió clase is-gone');
    },
  },

  // ───────────────────────────────────────────────────────
  // 10. Seguridad: CSP + SRI + headers
  // ───────────────────────────────────────────────────────
  {
    name: 'Security · CSP meta presente con script-src restrictivo',
    async fn(page) {
      await page.goto(BASE_URL);
      const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
      expect(csp, 'falta CSP meta tag');
      expect(csp.includes("default-src 'self'"), 'CSP sin default-src self');
      expect(csp.includes("frame-ancestors 'none'"), 'CSP sin frame-ancestors none (anti-clickjacking)');
      expect(csp.includes("object-src 'none'"), 'CSP sin object-src none');
      expect(!csp.includes("script-src 'unsafe-inline'"), 'CSP permite scripts inline ejecutables');
      expect(!csp.includes("script-src 'unsafe-eval'"), 'CSP permite eval');
    },
  },

  {
    name: 'Security · 3 CDN scripts con SRI integrity sha384',
    async fn(page) {
      await page.goto(BASE_URL);
      const scripts = await page.$$eval('script[src^="https://"]', (els) =>
        els.map((el) => ({
          src: el.getAttribute('src'),
          integrity: el.getAttribute('integrity'),
          crossorigin: el.getAttribute('crossorigin'),
        }))
      );
      expect(scripts.length >= 3, `esperaba al menos 3 CDN scripts, encontré ${scripts.length}`);
      for (const s of scripts) {
        expect(s.integrity?.startsWith('sha384-'), `${s.src} sin integrity sha384`);
        expect(s.crossorigin === 'anonymous', `${s.src} sin crossorigin=anonymous`);
      }
    },
  },

  {
    name: 'Security · todos los target=_blank tienen rel noopener noreferrer',
    async fn(page) {
      await page.goto(BASE_URL);
      const links = await page.$$eval('a[target="_blank"]', (els) =>
        els.map((el) => ({ href: el.getAttribute('href'), rel: el.getAttribute('rel') }))
      );
      expect(links.length > 0, 'no hay links target=_blank para verificar');
      for (const l of links) {
        expect(l.rel?.includes('noopener'), `link ${l.href} sin rel=noopener`);
        expect(l.rel?.includes('noreferrer'), `link ${l.href} sin rel=noreferrer`);
      }
    },
  },

  {
    name: 'Security · Permissions-Policy bloquea camera/mic/geo',
    async fn(page) {
      await page.goto(BASE_URL);
      const pp = await page.locator('meta[http-equiv="Permissions-Policy"]').getAttribute('content');
      expect(pp, 'falta Permissions-Policy meta');
      expect(pp.includes('camera=()'), 'camera no bloqueada');
      expect(pp.includes('microphone=()'), 'microphone no bloqueada');
      expect(pp.includes('geolocation=()'), 'geolocation no bloqueada');
    },
  },
];

// ─────────────────────────────────────────────────────────
//  Runner
// ─────────────────────────────────────────────────────────

async function run() {
  // Mock CDN scripts y fuentes para tests deterministas
  const GSAP = fs.readFileSync('/tmp/node_modules/gsap/dist/gsap.min.js');
  const ST = fs.readFileSync('/tmp/node_modules/gsap/dist/ScrollTrigger.min.js');
  const LENIS = fs.readFileSync('/tmp/node_modules/lenis/dist/lenis.min.js');

  const browser = await chromium.launch({ args: ['--no-sandbox'] });

  for (const test of tests) {
    const ctx = await browser.newContext({
      viewport: test.viewport ?? { width: 1280, height: 800 },
    });
    const page = await ctx.newPage();

    await page.route('**/gsap.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: GSAP }));
    await page.route('**/ScrollTrigger.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: ST }));
    await page.route('**/lenis.min.js', (r) => r.fulfill({ contentType: 'application/javascript', body: LENIS }));
    await page.route('**/fonts.googleapis.com/**', (r) => r.abort());
    await page.route('**/fonts.gstatic.com/**', (r) => r.abort());

    process.stdout.write(`  ${test.name} ... `);
    try {
      await test.fn(page);
      console.log('✓');
      results.passed.push(test.name);
    } catch (err) {
      console.log('✗');
      console.log(`    ${err.message}`);
      results.failed.push({ name: test.name, error: err.message });
      try {
        const slug = test.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 60);
        await page.screenshot({ path: path.join(ARTIFACTS, `FAIL-${slug}.png`), fullPage: true });
      } catch { /* ignore screenshot errors */ }
    }
    await ctx.close();
  }

  await browser.close();

  console.log('\n══════════════════════════════════════════');
  console.log(`  ${results.passed.length} passed, ${results.failed.length} failed`);
  console.log('══════════════════════════════════════════');
  if (results.failed.length > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Runner crashed:', err);
  process.exit(2);
});
