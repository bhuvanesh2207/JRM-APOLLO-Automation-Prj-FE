// Layout.jsx
import React from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import Footer from "./Footer";

function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main-wrapper">
        <Navbar />
        <Outlet />
        <Footer />
      </div>
    </div>
  );
}

export default Layout;