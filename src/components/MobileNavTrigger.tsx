"use client";

export default function MobileNavTrigger() {
    return (
      <button
        className="md:hidden inline-flex items-center gap-2 px-3 py-2 border rounded"
        onClick={() => document.documentElement.classList.add("nav-open")}
      >
        ☰ 메뉴
      </button>
    );
  }
