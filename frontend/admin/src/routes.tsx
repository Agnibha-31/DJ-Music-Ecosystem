import { createBrowserRouter } from "react-router-dom";
import { AdminLayout } from "./components/admin/AdminLayout";
import { DJAccessRequestModal } from "./components/DJAccessRequestModal";
import { AdminProvider } from "./context/AdminContext";
import { Dashboard } from "./pages/Dashboard";
import { SongManagement } from "./pages/SongManagement";
import { PlaybackAnalytics } from "./pages/PlaybackAnalytics";
import { PollAnalytics } from "./pages/PollAnalytics";
import { ControlPanel } from "./pages/ControlPanel";
import { HistoryLogs } from "./pages/HistoryLogs";
import { SystemConfig } from "./pages/SystemConfig";
import { UserMonitoring } from "./pages/UserMonitoring";
import { AdminLogin } from "./pages/AdminLogin";
import { AdminSignUp } from "./pages/AdminSignUp";

const AdminShell = () => (
  <AdminProvider>
    <AdminLayout />
    <DJAccessRequestModal />
  </AdminProvider>
);

export const adminRoutes = [
  {
    path: "/login",
    Component: AdminLogin,
  },
  {
    path: "/signup",
    Component: AdminSignUp,
  },
  {
    path: "/",
    Component: AdminShell,
    children: [
      { index: true, Component: Dashboard },
      { path: "songs", Component: SongManagement },
      { path: "analytics/playback", Component: PlaybackAnalytics },
      { path: "analytics/polls", Component: PollAnalytics },
      { path: "control", Component: ControlPanel },
      { path: "history", Component: HistoryLogs },
      { path: "settings", Component: SystemConfig },
      { path: "monitoring", Component: UserMonitoring },
    ],
  },
];

export const router = createBrowserRouter(adminRoutes);
