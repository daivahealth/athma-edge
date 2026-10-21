import { createBrowserRouter, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import LoginPage from '@/pages/login';
import PatientsPage from '@/pages/patients';
import PatientDetailPage from '@/pages/patients/detail';
import ClinicalNotesPage from '@/pages/clinical-notes';
import NewClinicalNotePage from '@/pages/clinical-notes/new';
import PatientNotesPage from '@/pages/clinical-notes/detail';
import SyncStatusPage from '@/pages/admin/sync';
import UsersPage from '@/pages/admin/users';
import AuditPage from '@/pages/admin/audit';

// MainLayout runs the auth guard and renders the BCP banner and sidebar,
// so every authenticated route sits under it — the same job the (main)
// route group did under the App Router.
export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/login" replace /> },
  { path: '/login', element: <LoginPage /> },
  {
    element: <MainLayout />,
    children: [
      { path: '/patients', element: <PatientsPage /> },
      { path: '/patients/:mrn', element: <PatientDetailPage /> },
      { path: '/clinical-notes', element: <ClinicalNotesPage /> },
      // Static segment before the dynamic one; React Router ranks it
      // higher regardless, but the order documents the intent.
      { path: '/clinical-notes/new', element: <NewClinicalNotePage /> },
      { path: '/clinical-notes/:mrn', element: <PatientNotesPage /> },
      { path: '/admin/sync', element: <SyncStatusPage /> },
      { path: '/admin/users', element: <UsersPage /> },
      { path: '/admin/audit', element: <AuditPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/login" replace /> },
], {
  // All six are no-ops for this app — it uses no RR fetchers, actions or
  // forms, does not server-render, and its only splat route is a redirect.
  // Opting in now silences the warnings and makes the v7 upgrade a bump.
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});
