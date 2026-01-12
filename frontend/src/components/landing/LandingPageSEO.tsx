import { Helmet } from "react-helmet-async";

const SEO_CONFIG = {
  title:
    "Entmoot - Family Goal Planning Made Fun | Build Your Adventure Together",
  description:
    "Transform family chaos into epic adventures. Entmoot helps families set SMART goals, plan daily quests, celebrate wins, and grow together. Free for families up to 5.",
  url: "https://entmoot.app",
  image: "/og-image.png", // Placeholder for OG image
  siteName: "Entmoot",
  twitterHandle: "@entmootapp",
} as const;

export function LandingPageSEO() {
  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{SEO_CONFIG.title}</title>
      <meta name="title" content={SEO_CONFIG.title} />
      <meta name="description" content={SEO_CONFIG.description} />

      {/* Canonical URL */}
      <link rel="canonical" href={SEO_CONFIG.url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={SEO_CONFIG.url} />
      <meta property="og:title" content={SEO_CONFIG.title} />
      <meta property="og:description" content={SEO_CONFIG.description} />
      <meta
        property="og:image"
        content={`${SEO_CONFIG.url}${SEO_CONFIG.image}`}
      />
      <meta property="og:site_name" content={SEO_CONFIG.siteName} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={SEO_CONFIG.url} />
      <meta name="twitter:title" content={SEO_CONFIG.title} />
      <meta name="twitter:description" content={SEO_CONFIG.description} />
      <meta
        name="twitter:image"
        content={`${SEO_CONFIG.url}${SEO_CONFIG.image}`}
      />
      <meta name="twitter:site" content={SEO_CONFIG.twitterHandle} />

      {/* Additional SEO */}
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="author" content="Entmoot" />
      <meta
        name="keywords"
        content="family goals, goal planning, family planning app, SMART goals, family organizer, daily planner, weekly review, gamification, family coordination"
      />
    </Helmet>
  );
}
