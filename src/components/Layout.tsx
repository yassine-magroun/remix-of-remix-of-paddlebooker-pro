import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { WhatsAppFAB } from "./WhatsAppFAB";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function Layout({ children, hideFooter }: LayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 pt-16">{children}</main>
      {!hideFooter && <Footer />}
      <WhatsAppFAB />
    </div>
  );
}
