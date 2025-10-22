// components/AppNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Boxes, MapPin, Package, Shuffle, Grid3X3, QrCode } from "lucide-react";

type Props = { onNavigate?: () => void };

const routes = [
  { href: "/", label: "대시보드", icon: Grid3X3 },
  { href: "/items", label: "품목(Items)", icon: Package },
  { href: "/locations", label: "위치(Locations)", icon: MapPin },
  { href: "/stock", label: "재고(Stock)", icon: Boxes },
  { href: "/tx", label: "입/출고/이동", icon: Shuffle },
  { href: "/labels", label: "라벨/QR", icon: QrCode },
];

export default function AppNav({ onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav className="p-2 space-y-1">
      {routes.map(({ href, label, icon: Icon }) => {
        const active =
          pathname === href || (href !== "/" && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            className={[
              "flex items-center gap-2 px-3 py-2 rounded text-sm",
              active
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100",
            ].join(" ")}
          >
            <Icon size={16} />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
