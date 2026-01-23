import { Link } from "react-router-dom";
import { Twitter, Instagram, Facebook } from "lucide-react";
import { HERITAGE_COLORS } from "./design-system";

// Tree of Life Medallion Logo for footer
function MedallionLogo({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      style={{ color: HERITAGE_COLORS.sageGreen }}
    >
      <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="0.5" fill="none" opacity="0.5" />
      <path d="M20 32 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 22 Q14 18 10 12" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M20 22 Q26 18 30 12" stroke="currentColor" strokeWidth="1" fill="none" />
      <path d="M20 22 L20 10" stroke="currentColor" strokeWidth="1" />
      <path d="M20 32 Q14 34 10 36" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.6" />
      <path d="M20 32 Q26 34 30 36" stroke="currentColor" strokeWidth="0.75" fill="none" opacity="0.6" />
    </svg>
  );
}

// Discord icon (Lucide doesn't have it)
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
  const baseClass = "text-sm transition-colors duration-200";

  if (external || href.startsWith("http") || href === "#") {
    return (
      <a
        href={href}
        className={`${baseClass} hover:opacity-80`}
        style={{ color: `${HERITAGE_COLORS.parchment}99` }}
        {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      to={href}
      className={`${baseClass} hover:opacity-80`}
      style={{ color: `${HERITAGE_COLORS.parchment}99` }}
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
        className="mb-4 text-sm font-semibold uppercase tracking-wider"
        style={{ color: HERITAGE_COLORS.parchment }}
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
      className="flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 hover:scale-110"
      style={{
        backgroundColor: `${HERITAGE_COLORS.parchment}10`,
        color: `${HERITAGE_COLORS.parchment}80`,
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
    { label: "Roadmap", href: "/roadmap" },
  ];

  const companyLinks = [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  const legalLinks = [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
  ];

  return (
    <footer style={{ backgroundColor: HERITAGE_COLORS.deepForest }}>
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {/* Main footer content */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="sm:col-span-2 lg:col-span-1">
            {/* Logo */}
            <Link to="/" className="mb-4 flex items-center gap-2.5">
              <MedallionLogo className="h-9 w-9" />
              <span
                className="text-xl font-semibold"
                style={{
                  color: HERITAGE_COLORS.parchment,
                  fontFamily: "'Georgia', serif",
                }}
              >
                Entmoot
              </span>
            </Link>
            {/* Tagline */}
            <p
              className="text-sm"
              style={{ color: `${HERITAGE_COLORS.parchment}70` }}
            >
              Building intentional families since 2026
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
              className="mb-4 text-sm font-semibold uppercase tracking-wider"
              style={{ color: HERITAGE_COLORS.parchment }}
            >
              Connect
            </h3>
            <div className="flex gap-3">
              <SocialIcon
                href="https://twitter.com/entmootapp"
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
          style={{ borderColor: `${HERITAGE_COLORS.parchment}15` }}
        >
          {/* Copyright */}
          <p
            className="text-center text-sm"
            style={{ color: `${HERITAGE_COLORS.parchment}50` }}
          >
            &copy; 2026 Entmoot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
