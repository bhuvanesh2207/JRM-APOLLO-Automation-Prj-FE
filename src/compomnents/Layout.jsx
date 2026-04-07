// Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import AutoBreadcrumb from "./AutoBreadcrumb";
function Layout() {
  return (
    <div className="flex min-h-screen">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Wrapper */}
      <div
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: "var(--sidebar-current-width)",
        }}
      >
        <Navbar />

        {/* Content */}
        <main className="flex-1">
          <AutoBreadcrumb />
          <Outlet />
        </main>

        {/* Footer */}
        <Footer />

      </div>
    </div>
  );
} 
export default Layout;