import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import InstallPrompt from "./InstallPrompt";

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
      <InstallPrompt />
    </div>
  );
}
