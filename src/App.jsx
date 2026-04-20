import { Routes, Route, Navigate } from "react-router-dom";
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
import EmployeeDashboard from "./pages/Employee/EmployeeDashboard.jsx";
import Profile from "./pages/Employee/Profile.jsx";
import Attendance from "./pages/Employee/Attendance.jsx";
import Overtime from "./pages/Employee/Overtime.jsx";
import Permissions from "./pages/Employee/Permissions.jsx";
import LeaveForm from "./pages/Employee/LeaveForm.jsx";
import LeaveReview from "./pages/Employee/LeaveReview.jsx";
import LeaveList from "./pages/Attendance/LeaveList.jsx";
import PermissionApproval from "./pages/Employee/PermissionApproval.jsx";
import OvertimeRequest from "./pages/Attendance/OvertimeRequest.jsx";

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

/* PERMISSIONS */
import PermissionList from "./pages/Attendance/PermissionList.jsx";
import AddPermissionForm from "./pages/Attendance/AddPermissionForm.jsx";
import EditPermissionPage from "./pages/Attendance/EditPermissionPage.jsx";

/* OT */
import AdminOTAssign from "./pages/Attendance/AdminOTAssign.jsx";
import AdminOTReview from "./pages/Attendance/AdminOTReview.jsx";

import ChangePassword from "./pages/ChangePassword.jsx";
import ProtectedRoute from "./routes/ProtectedRoute";
import Overtimeapproval from "./pages/Attendance/Overtimeapproval.jsx";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/admin-dashboard"
        element={<Navigate replace to="/admin/dashboard" />}
      />
      <Route
        path="/employee-dashboard"
        element={<Navigate replace to="/employee/dashboard" />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePassword />} />

        <Route element={<Layout />}>
          {/* ── Admin Dashboard ── */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* ── Domain Tracker ── */}
          <Route
            path="/domain/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DomainForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domain/all"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DomainDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domain/update/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditDomainPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domain/history"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DomainUpdateHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/domain/history/:domainId"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <DomainUpdateHistory />
              </ProtectedRoute>
            }
          />

          {/* ── Client ── */}
          <Route
            path="/client/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/update/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClientForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/client/all"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ClientDetails />
              </ProtectedRoute>
            }
          />

          {/* ── Employee admin pages ── */}
          <Route
            path="/employee/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/all"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employees/view/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmployeeView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/leaves/:id/review"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LeaveReview />
              </ProtectedRoute>
            }
          />

          {/* ── OT admin routes ── */}
          <Route
            path="/admin/ot-requests/:ot_id/review"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOTReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/ot-requests/assign"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminOTAssign />
              </ProtectedRoute>
            }
          />

          {/* ── Employee panel ── */}
          <Route
            path="/employee/dashboard"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/profile"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/attendance"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <Attendance />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/leaveForm"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <LeaveForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/overtime"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <Overtime />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/permissions"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <Permissions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/overtime/request"
            element={
              <ProtectedRoute allowedRoles={["employee"]}>
                <OvertimeRequest />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/permissions/:id/review"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PermissionApproval />
              </ProtectedRoute>
            }
          />

          {/* ── Shifts ── */}
          <Route
            path="/shifts/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ShiftForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts/all"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ShiftList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts/assign"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AssignShift />
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditShiftPage />
              </ProtectedRoute>
            }
          />

          {/* ── Attendance / OT records ── */}
          <Route
            path="/attendance/overtime"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Overtimeapproval />
              </ProtectedRoute>
            }
          />

          {/* ── Calendar ── */}
          <Route
            path="/attendance/calendar"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Calendar />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/holiday/add"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddHolidayForm />
              </ProtectedRoute>
            }
          />

          {/* ── Permissions ── */}
          <Route
            path="/attendance/permissions"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <PermissionList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/leaves"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <LeaveList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/permissions/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AddPermissionForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/attendance/permissions/edit/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EditPermissionPage />
              </ProtectedRoute>
            }
          />

          {/* ── Email Config ── */}
          <Route
            path="/email-config/new"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmailConfigForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/email-config/update/:id"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <EmailConfigForm />
              </ProtectedRoute>
            }
          />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
