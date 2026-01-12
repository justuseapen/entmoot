import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { TreePine, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  creamWhite: "#FFF8E7",
  darkForest: "#1B3A1A",
} as const;

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
        isScrolled ? "shadow-md" : ""
      }`}
      style={{
        backgroundColor: isScrolled ? LANDING_COLORS.creamWhite : "transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 transition-opacity hover:opacity-80"
        >
          <TreePine
            className="h-8 w-8"
            style={{ color: LANDING_COLORS.forestGreen }}
          />
          <span
            className="text-xl font-bold"
            style={{ color: LANDING_COLORS.darkForest }}
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
              style={{ color: LANDING_COLORS.darkForest }}
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
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Sign In
          </Link>
          <Button
            asChild
            className="rounded-lg px-6 py-2 font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: LANDING_COLORS.forestGreen }}
          >
            <Link to="/register">Get Started</Link>
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
                style={{ color: LANDING_COLORS.darkForest }}
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-[300px]"
              style={{ backgroundColor: LANDING_COLORS.creamWhite }}
            >
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <TreePine
                    className="h-6 w-6"
                    style={{ color: LANDING_COLORS.forestGreen }}
                  />
                  <span style={{ color: LANDING_COLORS.darkForest }}>
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
                    style={{ color: LANDING_COLORS.darkForest }}
                  >
                    {link.label}
                  </a>
                ))}
                <hr
                  className="my-2"
                  style={{ borderColor: LANDING_COLORS.leafGreen + "40" }}
                />
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-base font-medium transition-colors hover:opacity-70"
                  style={{ color: LANDING_COLORS.darkForest }}
                >
                  Sign In
                </Link>
                <Button
                  asChild
                  className="mt-2 w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: LANDING_COLORS.forestGreen }}
                >
                  <Link
                    to="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Get Started
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
