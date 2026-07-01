import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { AdminNav } from "@/components/navigation/AdminNav";

export function AdminLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-wealth-bg">
      <AdminNav />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
