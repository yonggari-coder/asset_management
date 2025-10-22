"use client";

import AppNav from "../components/AppNav";

export default function MobileDrawer() {
  function close() {
    document.documentElement.classList.remove("nav-open");
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 hidden md:hidden"
      onClick={close}
      data-mobile-overlay
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-72 bg-white border-r p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-12 flex items-center px-2 border-b font-semibold">
          🏷️ IMS
        </div>
        <AppNav onNavigate={close} />
      </div>

      {/* 스타일 */}
      <style>{`
        .nav-open [data-mobile-overlay]{ display:block }
      `}</style>
    </div>
  );
}
