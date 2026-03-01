import { RenderMode, ServerRoute } from '@angular/ssr';

// Paths to prerender at build time for SEO
const prerenderPaths = [
  '',
  'methodology',
  'pricing',
  'about',
  'privacy',
  'terms',
  'login',
  'register',
  'forgot-password',
  'comparison',
  'fine-calculator',
  'board-risk',
  'timeline',
  'nis2/scope-check',
  'contract-analysis',
  'blog',
  'dora-explorer',
  'framework-mapping',
  'cost-calculator',
  'training-quiz',
  'incident-decision-tree',
  'board-report',
  'policy-generator',
  'contract-generator',
  'contract-checklist',
  'playbook',
  'vendors',
  'nis2/assessment',
  'company-profile',
  'workspace',
];

// Client-rendered only (no prerender)
const clientPaths = [
  'assessment',
];

const i18nLangs = ['en', 'et'];

export const serverRoutes: ServerRoute[] = [
  // Unprefixed prerender routes
  ...prerenderPaths.map(p => ({ path: p, renderMode: RenderMode.Prerender as const })),

  // Unprefixed client routes
  ...clientPaths.map(p => ({ path: p, renderMode: RenderMode.Client as const })),

  // Lang-prefixed prerender routes (e.g. en/pricing, et/pricing)
  ...i18nLangs.flatMap(lang =>
    prerenderPaths.map(p => ({
      path: p ? `${lang}/${p}` : lang,
      renderMode: RenderMode.Prerender as const,
    }))
  ),

  // Lang-prefixed client routes
  ...i18nLangs.flatMap(lang =>
    clientPaths.map(p => ({
      path: `${lang}/${p}`,
      renderMode: RenderMode.Client as const,
    }))
  ),

  // Everything else — client-side only
  { path: '**', renderMode: RenderMode.Client },
];
