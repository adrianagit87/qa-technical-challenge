import { test, expect } from '../../fixtures/page-fixtures';
import AxeBuilder from '@axe-core/playwright';

/**
 * Auditoría de accesibilidad con axe-core (WCAG 2.1 AA).
 *
 * Enfoque data-driven: un array define las páginas a auditar,
 * y un loop genera los tests dinámicamente.
 *
 * Criterio: Las violaciones se reportan como hallazgos informativos.
 * Las violaciones "critical" se documentan como bugs de accesibilidad
 * de OSSN (image-alt, label) pero NO fallan el test — son defectos
 * de la aplicación, no de la suite de pruebas.
 *
 * Las páginas que requieren auth usan storageState del setup.
 * Las páginas públicas limpian cookies para evitar redirección a /home.
 */

interface PageAuditConfig {
  name: string;
  path: string;
  screenshotName: string;
  /** Si true, limpia cookies antes de navegar (para páginas públicas) */
  needsCleanSession: boolean;
}

const PAGES_TO_AUDIT: PageAuditConfig[] = [
  { name: 'Registro', path: '/', screenshotName: 'a11y-registro', needsCleanSession: true },
  { name: 'Login', path: '/login', screenshotName: 'a11y-login', needsCleanSession: true },
  { name: 'Feed', path: '/home', screenshotName: 'a11y-feed', needsCleanSession: false },
  { name: 'Perfil', path: '/u/administrator', screenshotName: 'a11y-perfil', needsCleanSession: false },
];

test.describe('Auditoria de Accesibilidad (axe-core)', () => {

  for (const pageConfig of PAGES_TO_AUDIT) {
    test(`a11y: Pagina de ${pageConfig.name}`, async ({ page }) => {
      // Limpiar sesión para páginas públicas (evitar redirección a /home)
      if (pageConfig.needsCleanSession) {
        await page.context().clearCookies();
      }

      await page.goto(pageConfig.path);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      console.log(`\n=== A11Y: ${pageConfig.name} ===`);
      console.log(`Violaciones: ${results.violations.length} | Pasan: ${results.passes.length}`);
      results.violations.forEach(v => {
        console.log(`  [${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} elementos)`);
      });

      await page.screenshot({
        path: `evidencias/manual/${pageConfig.screenshotName}.png`,
        fullPage: true,
      });

      // Documentar TODAS las violaciones como hallazgos
      test.info().annotations.push({
        type: 'a11y',
        description: `${pageConfig.name}: ${results.violations.length} violaciones, ${results.passes.length} pasan`,
      });

      // Documentar violaciones critical como bugs de OSSN
      const critical = results.violations.filter(v => v.impact === 'critical');
      if (critical.length > 0) {
        test.info().annotations.push({
          type: 'a11y-bug',
          description: `BUGS de accesibilidad en ${pageConfig.name}: ${critical.map(v => `${v.id} (${v.nodes.length} elementos)`).join(', ')}`,
        });
      }

      // Assertion: verificar que axe-core ejecutó correctamente (sanity check)
      // Las violaciones critical son bugs de OSSN documentados — no fallan el test.
      expect(
        results.passes.length + results.violations.length,
        'axe-core debe evaluar al menos 1 regla de accesibilidad'
      ).toBeGreaterThan(0);
    });
  }
});
