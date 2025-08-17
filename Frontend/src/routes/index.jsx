import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Inventory from "../pages/InventoryPage/InventoryPage";
import RegularOrders from "../components/RegularOrders/RegularOrders";
import VendorsPage from "../pages/VendorsPage/VendorsPage";
import EventOrdersPage from "../pages/EventOrdersPage/EventOrdersPage";
import ExpensesPage from "../pages/ExpensesPage/ExpensesPage";
import AccountingLandings from "../pages/AccountingLandings/AccountingLandings";
import ExpenseManagement from "../components/Expenses/Expenses";
import DashboardLandings from "../pages/DashboardLandings/DashboardLandings";
import LoginLandings from "../pages/LoginLandings/LoginLandings";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";

// import Dashboard from "../pages/Dashboard";

// import Accounting from "../pages/Accounting";
// import Vendors from "../pages/Vendors";
// import CreditCards from "../pages/CreditCards";
// import Marketing from "../pages/Marketing";
// import Staff from "../pages/Staff";
// import Settings from "../pages/Settings";

const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route path="/login" element={<LoginLandings />} />
        <Route
          index
          element={
            <ProtectedRoute>
              <DashboardLandings />
            </ProtectedRoute>
          }
        />
        <Route
          path="regular-orders"
          element={
            <ProtectedRoute>
              <RegularOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="event-orders"
          element={
            <ProtectedRoute>
              <EventOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="inventory"
          element={
            <ProtectedRoute>
              <Inventory />
            </ProtectedRoute>
          }
        />
        <Route
          path="accounting"
          element={
            <ProtectedRoute>
              <AccountingLandings />
            </ProtectedRoute>
          }
        />
        <Route
          path="expenses"
          element={
            <ProtectedRoute>
              <ExpenseManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="vendors"
          element={
            <ProtectedRoute>
              <VendorsPage />
            </ProtectedRoute>
          }
        />
        {/* 
        <Route path="marketing" element={<Marketing />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<Settings />} /> */}
      </Route>
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
