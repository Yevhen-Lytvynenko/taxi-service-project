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
import { LiveMonitoringMap } from './pages/LiveMonitoringMap';
import { DriverTrackingPage } from './pages/DriverTrackingPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
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
           <Route path="/locations" element={<Locations />} />
           <Route path="/tariffs" element={<Tariffs />} />
           <Route path="/live/driver/:driverId" element={<DriverTrackingPage />} />
           <Route path="/live" element={<LiveMonitoringMap />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;