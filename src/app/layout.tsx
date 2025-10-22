// app/layout.tsx
import "./globals.css";
import Link from "next/link";
import AppNav from "../components/AppNav";
import MobileDrawer from "../components/MobileDrawer";
import MobileNavTrigger from "../components/MobileNavTrigger";

export const metadata = {
  title: "IMS",
  description: "Internal Inventory Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" suppressHydrationWarning={true}>
      <body className="min-h-screen">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden md:block w-64 border-r bg-white">
            <div className="h-14 flex items-center px-4 border-b font-semibold">🏷️ IMS</div>
            <AppNav />
          </aside>

          {/* Main */}
          <div className="flex-1 flex flex-col">
            {/* Topbar */}
            <header className="h-14 border-b bg-white flex items-center px-4 gap-2">
              <MobileNavTrigger />
              <h1 className="font-semibold">Dashboard</h1>
              <div className="ml-auto text-sm text-gray-600">
                {/* 필요 시 세션/유저 표기 영역 */}
                {/* <UserMenu /> */}
              </div>
            </header>

            {/* Content */}
            <main className="p-6">{children}</main>
          </div>
        </div>

        {/* Mobile Drawer */}
        <MobileDrawer />
      </body>
    </html>
  );
}


