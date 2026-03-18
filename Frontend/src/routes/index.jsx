import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import Inventory from "../pages/InventoryPage/InventoryPage";
import RegularOrders from "../pages/RegularOrdersPage/RegularOrdersPage";
import VendorsPage from "../pages/VendorsPage/VendorsPage";
import EventOrdersPage from "../pages/EventOrdersPage/EventOrdersPage";
import ExpensesPage from "../pages/ExpensesPage/ExpensesPage";
import AccountingPage from "../pages/AccountingPage/AccountingPage";
import DailyLedgerPage from "../pages/DailyLedgerPage/DailyLedgerPage";
import MarketingPage from "../pages/MarketingPage/MarketingPage";
import DashboardPage from "../pages/DashboardPage/DashboardPage";
import ProtectedRoute from "../components/ProtectedRoute/ProtectedRoute";
import AuthPage from "../pages/LoginPage/LoginPage";
import WorkingOnItPage from "../pages/WorkingOnItPage/WorkingOnItPage";
import { ConfigProvider } from "antd";
import { themeConfig } from "../theme";

const AppRouter = () => (
  <ConfigProvider theme={themeConfig}>
    <BrowserRouter>
    <Routes>
      <Route path="/login" element={<AuthPage mode={"login"} />} />
      <Route path="/signup" element={<AuthPage mode={"signup"} />} />
      
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="regular-orders" element={<RegularOrders />} />
        <Route path="event-orders" element={<EventOrdersPage />} />
        <Route path="inventory" element={<Inventory />} />
        <Route path="accounting" element={<AccountingPage />} />
        <Route path="ledger" element={<DailyLedgerPage />} />
        <Route path="marketing" element={<MarketingPage />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="vendors" element={<VendorsPage />} />
        <Route path="working-on-it" element={<WorkingOnItPage />} />
      </Route>
    </Routes>
  </BrowserRouter>
  </ConfigProvider>
);

export default AppRouter;
