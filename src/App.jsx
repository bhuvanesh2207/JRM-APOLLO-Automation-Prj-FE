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

/* EMPLOYEE */
import EmployeeForm from "./pages/Employee/EmployeeForm.jsx";
import EmployeeDetails from "./pages/Employee/EmployeeDetails.jsx";
import EditEmployeePage from "./pages/Employee/EditEmployeePage.jsx";
import EmployeeView from "./pages/Employee/Employee'sview.jsx";

/* CALENDAR */
import Calendar from "./pages/Calendar/Calendar.jsx";
import AddHolidayForm from "./pages/Calendar/Addholidayform.jsx";

/* EMAIL CONFIG */
import EmailConfigForm from "./pages/Admin/EmailConfigForm.jsx";

/* SHIFTS */
import ShiftForm from "./pages/Employee/ShiftForm.jsx";
import ShiftList from "./pages/Employee/ShiftList.jsx";
import AssignShift from "./pages/Employee/AssignShift.jsx";
import EditShiftPage from "./pages/Employee/EditShiftPage.jsx";

/* PERMISSIONS ← NEW */
import PermissionList from "./pages/Attendance/PermissionList.jsx";
import AddPermissionForm from "./pages/Attendance/AddPermissionForm.jsx";
import EditPermissionPage from "./pages/Attendance/EditPermissionPage.jsx";

import ProtectedRoute from "./routes/ProtectedRoute";

import Overtimeapproval from "./pages/Attendance/Overtimeapproval.jsx";
function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

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
        <Route path="/domain/new" element={<DomainForm />} />
        <Route path="/domain/all" element={<DomainDetails />} />
        <Route path="/domain/update/:id" element={<EditDomainPage />} />
        <Route path="/domain/history" element={<DomainUpdateHistory />} />
        <Route path="/domain/history/:domainId" element={<DomainUpdateHistory />} />

        {/* Client */}
        <Route path="/client/new" element={<ClientForm />} />
        <Route path="/client/update/:id" element={<ClientForm />} />
        <Route path="/client/all" element={<ClientDetails />} />

        {/* Employee */}
        <Route path="/employee/new" element={<EmployeeForm />} />
        <Route path="/employees/all" element={<EmployeeDetails />} />
        <Route path="/employees/edit/:id" element={<EditEmployeePage />} />
        <Route path="/employees/view/:id" element={<EmployeeView />} />

        {/* Shifts */}
        <Route path="/shifts/new" element={<ShiftForm />} />
        <Route path="/shifts/all" element={<ShiftList />} />
        <Route path="/shifts/assign" element={<AssignShift />} />
        <Route path="/shifts/edit/:id" element={<EditShiftPage />} />

        <Route path="/attendance/overtime" element={<Overtimeapproval />} />

        {/* Calendar */}
        <Route path="/attendance/calendar" element={<Calendar />} />
        <Route path="/attendance/holiday/add" element={<AddHolidayForm />} />

        {/* Permissions */}
        <Route path="/attendance/permissions"          element={<PermissionList />} />
        <Route path="/attendance/permissions/new"      element={<AddPermissionForm />} />
        <Route path="/attendance/permissions/edit/:id" element={<EditPermissionPage />} />

        {/* Email Config */}
        <Route path="/email-config/new" element={<EmailConfigForm />} />
        <Route path="/email-config/update/:id" element={<EmailConfigForm />} />
      </Route>
    </Routes>
  );
}

export default App;