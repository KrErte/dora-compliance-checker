import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './auth/auth.guard';

// MVP: DORA Article 30 ICT Contract Compliance Engine
// Kept: Assessment, Contract Audit, Results, Methodology, History
// Removed: Code Audit, Compare, Dashboard, Guardian, Negotiations, Incident Simulator

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then(m => m.RegisterComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'assessment',
    loadComponent: () => import('./pages/assessment.component').then(m => m.AssessmentComponent),
    canActivate: [authGuard]
  },
  {
    path: 'results/:id',
    loadComponent: () => import('./pages/results.component').then(m => m.ResultsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'history',
    loadComponent: () => import('./pages/history.component').then(m => m.HistoryComponent),
    canActivate: [authGuard]
  },
  {
    path: 'certificate/:id',
    loadComponent: () => import('./pages/certificate.component').then(m => m.CertificateComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract-analysis',
    loadComponent: () => import('./pages/contract-analysis.component').then(m => m.ContractAnalysisComponent),
    canActivate: [authGuard]
  },
  {
    path: 'contract-results/:id',
    loadComponent: () => import('./pages/contract-results.component').then(m => m.ContractResultsComponent),
    canActivate: [authGuard]
  },
  {
    path: 'methodology',
    loadComponent: () => import('./pages/methodology.component').then(m => m.MethodologyComponent),
    canActivate: [authGuard]
  }
];
