import Footer from "./Footer";

interface PublicLayoutProps {
  children: React.ReactNode;
  footerVariant?: "full" | "compact";
  hideFooter?: boolean;
}

export default function PublicLayout({ 
  children, 
  footerVariant = "full",
  hideFooter = false 
}: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-black">
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer variant={footerVariant} />}
    </div>
  );
}
