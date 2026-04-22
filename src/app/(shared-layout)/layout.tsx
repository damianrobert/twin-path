import Navbar from "@/components/web/Navbar";
import { ReactNode } from "react";

export default function SharedLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <Navbar />
      {children}
    </div>
  );
}
