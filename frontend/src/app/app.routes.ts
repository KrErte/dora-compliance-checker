import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'assessment',
    loadComponent: () => import('./pages/assessment.component').then(m => m.AssessmentComponent)
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent)
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history.component').then(m => m.HistoryComponent)
  },
  {
    path: 'certificate/:id',
    loadComponent: () => import('./pages/certificate.component').then(m => m.CertificateComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'compare',
    loadComponent: () => import('./pages/compare.component').then(m => m.CompareComponent)
  },
  {
    path: 'contract-analysis',
    loadComponent: () => import('./pages/contract-analysis.component').then(m => m.ContractAnalysisComponent)
  },
  {
    path: 'code-analysis',
    loadComponent: () => import('./pages/code-analysis.component').then(m => m.CodeAnalysisComponent)
  }
];
