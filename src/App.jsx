import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login.jsx";
import AdminDashboard from "./pages/Admin/AdminDashboard.jsx";
import ForgotPassword from "./pages/Admin/Forgotpassword.jsx";
import Layout from "./compomnents/Layout.jsx";

/* DOMAIN TRACKER */
import DomainForm from "./pages/DomainTracker/DomainForm.jsx";
import DomainDetails from "./pages/DomainTracker/DomainDeatils.jsx";
import EditDomainPage from "./pages/DomainTracker/EditDomainPage.jsx";
import DomainUpdateHistory from "./pages/DomainTracker/DomainUpdateHistory.jsx";

/* CLIENT */
import ClientForm from "./pages/Cleint/ClientForm.jsx";
import ClientDetails from "./pages/Cleint/ClientDetails.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* PROTECTED — all share Layout (Sidebar + Navbar + Footer) */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        {/* Domain Tracker */}
        <Route path="/domain/new"               element={<DomainForm />} />
        <Route path="/domain/all"               element={<DomainDetails />} />
        <Route path="/domain/update/:id"        element={<EditDomainPage />} />
        <Route path="/domain/history"           element={<DomainUpdateHistory />} />
        <Route path="/domain/history/:domainId" element={<DomainUpdateHistory />} />

        {/* Client */}
        <Route path="/client/new"               element={<ClientForm />} />
        <Route path="/client/update/:id"        element={<ClientForm />} />
        <Route path="/client/all"               element={<ClientDetails />} />
      </Route>
    </Routes>
  );
}

export default App;