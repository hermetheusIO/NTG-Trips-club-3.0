import { Link } from "wouter";
import { MapPin, Users, Sparkles, BookOpen, HelpCircle } from "lucide-react";

interface FooterProps {
  variant?: "full" | "compact";
  hideAdminLink?: boolean;
}

export default function Footer({ variant = "full", hideAdminLink = false }: FooterProps) {
  const currentYear = new Date().getFullYear();

  const mainLinks = [
    { href: "/trips-club/propostas", label: "Roteiros", icon: MapPin },
    { href: "/trips-club", label: "Trips Club", icon: Users },
    { href: "/trips-club/criar", label: "Criar Roteiro", icon: Sparkles },
    { href: "/digitais", label: "Digitais", icon: BookOpen },
  ];

  if (variant === "compact") {
    return (
      <footer className="border-t border-white/10 bg-black py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            {mainLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <span 
                  className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
            <Link href="/como-funciona">
              <span 
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-yellow-500 text-black font-bold rounded-full text-sm hover:bg-yellow-400 transition-colors cursor-pointer"
                data-testid="footer-link-conheca-club"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Conheça o Club
              </span>
            </Link>
          </div>
          <p className="text-center text-white/30 text-xs mt-4">
            © {currentYear} NonTourist Guide · Coimbra
          </p>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-white/10 bg-black/95 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span className="font-bold text-white">NTG Trips</span>
            </div>
            <p className="text-white/50 text-sm leading-relaxed">
              Viagens curtas com ritmo humano.<br />
              Curadoria + narrativa + memórias.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Explorar</h4>
            <nav className="flex flex-col gap-2">
              {mainLinks.map((link) => (
                <Link key={link.href} href={link.href}>
                  <span 
                    className="flex items-center gap-2 text-white/60 hover:text-yellow-500 transition-colors cursor-pointer text-sm"
                    data-testid={`footer-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <link.icon className="w-4 h-4" />
                    {link.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold text-white text-sm uppercase tracking-wider">Club</h4>
            <div className="space-y-3">
              <Link href="/como-funciona">
                <span 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 text-black font-bold rounded-full text-sm hover:bg-yellow-400 transition-colors cursor-pointer"
                  data-testid="footer-link-conheca-club"
                >
                  <HelpCircle className="w-4 h-4" />
                  Conheça o Club
                </span>
              </Link>
              <p className="text-white/40 text-xs">
                Prioridade, desconto e voz ativa.
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/30 text-xs">
            © {currentYear} NonTourist Guide · Coimbra, Portugal
          </p>
          
          {!hideAdminLink && (
            <Link href="/admin/login">
              <span 
                className="text-white/10 hover:text-white/30 text-[10px] uppercase tracking-widest transition-colors cursor-pointer"
                data-testid="footer-link-admin"
              >
                Admin
              </span>
            </Link>
          )}
        </div>
      </div>
    </footer>
  );
}
