import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get **it Done",
  description:
    "A simple way to keep track of your day — designed for ease of use.",
};

export default function GetItDoneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF9F6] font-nunito text-[#1A1A1A] antialiased">
      {children}
    </div>
  );
}
