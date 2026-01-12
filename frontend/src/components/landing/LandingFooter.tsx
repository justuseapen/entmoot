import { Link } from "react-router-dom";
import { TreePine, Twitter, Instagram, Facebook } from "lucide-react";

// Landing page design system colors
const LANDING_COLORS = {
  forestGreen: "#2D5A27",
  leafGreen: "#7CB342",
  skyBlue: "#64B5F6",
  warmGold: "#FFD54F",
  earthBrown: "#795548",
  creamWhite: "#FFF8E7",
  sunsetOrange: "#FF7043",
  darkForest: "#1B3A1A",
} as const;

// Discord icon (Lucide doesn't have it, so using a simple SVG)
function DiscordIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
  external?: boolean;
}

function FooterLink({ href, children, external = false }: FooterLinkProps) {
  const linkStyles = {
    color: `${LANDING_COLORS.creamWhite}B3`, // 70% opacity
    transition: "color 0.2s ease",
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = LANDING_COLORS.leafGreen;
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.currentTarget.style.color = `${LANDING_COLORS.creamWhite}B3`;
  };

  if (external || href.startsWith("http") || href === "#") {
    return (
      <a
        href={href}
        style={linkStyles}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="text-sm"
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={href}
      style={linkStyles}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="text-sm"
    >
      {children}
    </Link>
  );
}

interface FooterColumnProps {
  title: string;
  links: Array<{ label: string; href: string; external?: boolean }>;
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <h3
        className="mb-4 text-sm font-semibold tracking-wider uppercase"
        style={{ color: LANDING_COLORS.creamWhite }}
      >
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink href={link.href} external={link.external}>
              {link.label}
            </FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface SocialIconProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

function SocialIcon({ href, label, icon }: SocialIconProps) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110"
      style={{
        backgroundColor: `${LANDING_COLORS.creamWhite}15`,
        color: `${LANDING_COLORS.creamWhite}B3`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = `${LANDING_COLORS.leafGreen}30`;
        e.currentTarget.style.color = LANDING_COLORS.leafGreen;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = `${LANDING_COLORS.creamWhite}15`;
        e.currentTarget.style.color = `${LANDING_COLORS.creamWhite}B3`;
      }}
    >
      {icon}
    </a>
  );
}

export function LandingFooter() {
  const productLinks = [
    { label: "Features", href: "#features" },
    { label: "Pricing", href: "#pricing" },
    { label: "Roadmap", href: "#" },
    { label: "Changelog", href: "#" },
  ];

  const companyLinks = [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
  ];

  const legalLinks = [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "COPPA", href: "#" },
  ];

  return (
    <footer style={{ backgroundColor: LANDING_COLORS.darkForest }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Main footer content */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <Link to="/" className="mb-4 flex items-center gap-2">
              <TreePine
                className="h-8 w-8"
                style={{ color: LANDING_COLORS.leafGreen }}
              />
              <span
                className="text-xl font-bold"
                style={{ color: LANDING_COLORS.creamWhite }}
              >
                Entmoot
              </span>
            </Link>
            {/* Tagline */}
            <p
              className="text-sm"
              style={{ color: `${LANDING_COLORS.creamWhite}80` }}
            >
              Building family adventures since 2026
            </p>
          </div>

          {/* Product links */}
          <FooterColumn title="Product" links={productLinks} />

          {/* Company links */}
          <FooterColumn title="Company" links={companyLinks} />

          {/* Legal links */}
          <FooterColumn title="Legal" links={legalLinks} />

          {/* Social column */}
          <div>
            <h3
              className="mb-4 text-sm font-semibold tracking-wider uppercase"
              style={{ color: LANDING_COLORS.creamWhite }}
            >
              Connect
            </h3>
            <div className="flex gap-3">
              <SocialIcon
                href="https://twitter.com/entmoot"
                label="Twitter"
                icon={<Twitter className="h-5 w-5" />}
              />
              <SocialIcon
                href="https://instagram.com/entmoot"
                label="Instagram"
                icon={<Instagram className="h-5 w-5" />}
              />
              <SocialIcon
                href="https://facebook.com/entmoot"
                label="Facebook"
                icon={<Facebook className="h-5 w-5" />}
              />
              <SocialIcon
                href="https://discord.gg/entmoot"
                label="Discord"
                icon={<DiscordIcon className="h-5 w-5" />}
              />
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className="mt-12 border-t pt-8"
          style={{ borderColor: `${LANDING_COLORS.creamWhite}15` }}
        >
          {/* Copyright */}
          <p
            className="text-center text-sm"
            style={{ color: `${LANDING_COLORS.creamWhite}60` }}
          >
            &copy; 2026 Entmoot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
