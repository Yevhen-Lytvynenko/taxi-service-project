import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/organisms/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Users } from './pages/Users';
import { Drivers } from './pages/Drivers';
import { Clients } from './pages/Clients';
import { Orders } from './pages/Orders';
import { Tariffs } from './pages/Tariffs';
import { Employees } from './pages/Employees';
import { Transactions } from './pages/Transactions';
import { Reviews } from './pages/Reviews';
import { Locations } from './pages/Locations';
import { Chats } from './pages/Chats';
import { LiveMonitoringMap } from './pages/LiveMonitoringMap';
import { DriverTrackingPage } from './pages/DriverTrackingPage';
import {
  AnalyticsLayout,
  DemandPage,
  SurgePage,
  GeoPage,
  FleetPage,
  FinancePage,
} from './pages/analytics';
import { ProfileSettings } from './pages/settings/ProfileSettings';
import { RolesSettings } from './pages/settings/RolesSettings';
import { ReleaseNotes } from './pages/settings/ReleaseNotes';
import { ComplaintsPage } from './pages/Complaints';
import { AuditLogsPage } from './pages/AuditLogs';
import { LandingPage } from './pages/landing/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<Users />} />
          <Route path="/drivers" element={<Drivers />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/employees" element={<Employees />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/chats" element={<Chats />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/tariffs" element={<Tariffs />} />

          <Route path="/analytics" element={<AnalyticsLayout />}>
            <Route index element={<Navigate to="demand" replace />} />
            <Route path="demand" element={<DemandPage />} />
            <Route path="surge" element={<SurgePage />} />
            <Route path="geo" element={<GeoPage />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="finance" element={<FinancePage />} />
          </Route>

          <Route path="/settings">
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileSettings />} />
            <Route path="roles" element={<RolesSettings />} />
            <Route path="release-notes" element={<ReleaseNotes />} />
          </Route>

          <Route path="/live/driver/:driverId" element={<DriverTrackingPage />} />
          <Route path="/live" element={<LiveMonitoringMap />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
