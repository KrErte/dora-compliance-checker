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
  }
];
