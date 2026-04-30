import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentLaunch — Sia Partners",
  description:
    "Sia Partners' agentic AI accelerator platform. Identify, design, build and deploy AI agents in 10 weeks.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
