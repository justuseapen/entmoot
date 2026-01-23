import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { HERITAGE_COLORS } from "./design-system";
import { STRIPE_PAYMENT_LINK, PRICE_DISPLAY } from "@/config/pricing";

// Tree of Life Medallion Logo - simplified for nav
function MedallionLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      style={{ color: HERITAGE_COLORS.deepForest }}
    >
      {/* Outer circle */}
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      {/* Inner circle */}
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />

      {/* Tree trunk */}
      <path
        d="M20 32 L20 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Main branches */}
      <path
        d="M20 22 Q14 18 10 12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M20 22 Q26 18 30 12"
        stroke="currentColor"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M20 22 L20 10"
        stroke="currentColor"
        strokeWidth="1"
      />

      {/* Roots */}
      <path
        d="M20 32 Q14 34 10 36"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M20 32 Q26 34 30 36"
        stroke="currentColor"
        strokeWidth="0.75"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

interface NavLinkItem {
  label: string;
  href: string;
}

const NAV_LINKS: NavLinkItem[] = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
];

function scrollToSection(href: string) {
  const id = href.replace("#", "");
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

export function LandingNav() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      scrollToSection(href);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 right-0 left-0 z-50 transition-all duration-300 ${
        isScrolled ? "shadow-sm" : ""
      }`}
      style={{
        backgroundColor: isScrolled
          ? HERITAGE_COLORS.parchment
          : "transparent",
        borderBottom: isScrolled
          ? `1px solid ${HERITAGE_COLORS.antiqueBrass}15`
          : "none",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
        >
          <MedallionLogo className="h-9 w-9" />
          <span
            className="text-xl font-semibold tracking-tight"
            style={{
              color: HERITAGE_COLORS.charcoal,
              fontFamily: "'Georgia', serif",
            }}
          >
            Entmoot
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-medium transition-colors hover:opacity-70"
              style={{ color: HERITAGE_COLORS.sepia }}
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-4 md:flex">
          <Link
            to="/login"
            className="text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            Sign In
          </Link>
          <Button
            asChild
            className="rounded-lg px-5 py-2 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
          >
            <a href={STRIPE_PAYMENT_LINK}>
              Get Lifetime Access
            </a>
          </Button>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                style={{ color: HERITAGE_COLORS.charcoal }}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px]"
              style={{ backgroundColor: HERITAGE_COLORS.parchment }}
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2.5">
                  <MedallionLogo className="h-8 w-8" />
                  <span
                    style={{
                      color: HERITAGE_COLORS.charcoal,
                      fontFamily: "'Georgia', serif",
                    }}
                  >
                    Entmoot
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 flex flex-col gap-6">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className="text-base font-medium transition-colors hover:opacity-70"
                    style={{ color: HERITAGE_COLORS.sepia }}
                  >
                    {link.label}
                  </a>
                ))}
                <hr
                  className="my-2"
                  style={{ borderColor: `${HERITAGE_COLORS.antiqueBrass}30` }}
                />
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium transition-colors hover:opacity-70"
                  style={{ color: HERITAGE_COLORS.sepia }}
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className="mt-2 w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
                >
                  <a
                    href={STRIPE_PAYMENT_LINK}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Lifetime Access - {PRICE_DISPLAY}
                  </a>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
