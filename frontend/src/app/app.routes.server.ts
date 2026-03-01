import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Static public pages — prerender at build time for SEO
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'assessment', renderMode: RenderMode.Client },
  { path: 'methodology', renderMode: RenderMode.Prerender },
  { path: 'pricing', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'privacy', renderMode: RenderMode.Prerender },
  { path: 'terms', renderMode: RenderMode.Prerender },
  { path: 'login', renderMode: RenderMode.Prerender },
  { path: 'register', renderMode: RenderMode.Prerender },
  { path: 'forgot-password', renderMode: RenderMode.Prerender },
  { path: 'comparison', renderMode: RenderMode.Prerender },
  { path: 'fine-calculator', renderMode: RenderMode.Prerender },
  { path: 'board-risk', renderMode: RenderMode.Prerender },
  { path: 'timeline', renderMode: RenderMode.Prerender },
  { path: 'nis2/scope-check', renderMode: RenderMode.Prerender },
  { path: 'contract-analysis', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'dora-explorer', renderMode: RenderMode.Prerender },
  { path: 'framework-mapping', renderMode: RenderMode.Prerender },
  { path: 'cost-calculator', renderMode: RenderMode.Prerender },
  { path: 'training-quiz', renderMode: RenderMode.Prerender },
  { path: 'incident-decision-tree', renderMode: RenderMode.Prerender },
  { path: 'board-report', renderMode: RenderMode.Prerender },
  { path: 'policy-generator', renderMode: RenderMode.Prerender },
  { path: 'contract-generator', renderMode: RenderMode.Prerender },
  { path: 'contract-checklist', renderMode: RenderMode.Prerender },
  { path: 'playbook', renderMode: RenderMode.Prerender },
  { path: 'vendors', renderMode: RenderMode.Prerender },
  { path: 'nis2/assessment', renderMode: RenderMode.Prerender },
  { path: 'company-profile', renderMode: RenderMode.Prerender },

  // Everything else — client-side only
  { path: '**', renderMode: RenderMode.Client },
];
