import { Outlet } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { useHideOnScroll } from "@/hooks/useHideOnScroll";
import { cn } from "@/utils/cn";

export function MainLayout() {
  const { scrollRef, headerVisible } = useHideOnScroll();

  return (
    <div className="flex h-screen overflow-hidden bg-wealth-bg">
      <Sidebar />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Header visible={headerVisible} />
        <main
          ref={scrollRef}
          className={cn(
            "flex-1 overflow-y-auto px-6 pb-6 transition-[padding-top] duration-300 ease-in-out",
            headerVisible ? "pt-[5.5rem]" : "pt-6",
          )}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
