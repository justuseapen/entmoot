import { Helmet } from "react-helmet-async";

const SEO_CONFIG = {
  title:
    "Entmoot - Family Goal Planning Platform | Stop Managing, Start Leading",
  description:
    "The only goal planning platform built for families first. Connect daily tasks to long-term dreams with AI coaching, multi-scale reviews, and gamification. Get lifetime access for $149.",
  url: "https://entmoot.app",
  image: "/og-image.png",
  siteName: "Entmoot",
  twitterHandle: "@entmootapp",
} as const;

// JSON-LD structured data for SoftwareApplication
const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Entmoot",
  applicationCategory: "ProductivityApplication",
  operatingSystem: "Web Browser",
  description:
    "Family goal planning platform with AI coaching, multi-scale reviews (daily to annual), gamification, and COPPA compliance.",
  offers: {
    "@type": "Offer",
    price: "149",
    priceCurrency: "USD",
    priceValidUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    availability: "https://schema.org/LimitedAvailability",
    description: "Founding Family Edition - Lifetime Access",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "47",
    bestRating: "5",
    worstRating: "1",
  },
  author: {
    "@type": "Organization",
    name: "Entmoot",
    url: "https://entmoot.app",
  },
  featureList: [
    "AI Goal Coaching",
    "Multi-scale Reviews (Daily to Annual)",
    "Family Dashboard",
    "Gamification with Badges",
    "Calendar Sync",
    "COPPA Compliant",
  ],
};

// JSON-LD for Organization
const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Entmoot",
  url: "https://entmoot.app",
  logo: "https://entmoot.app/logo.png",
  description:
    "We believe the family dinner table is the most important conference room in the world.",
  founder: {
    "@type": "Person",
    name: "Justus Eapen",
    jobTitle: "Founder",
  },
  sameAs: ["https://twitter.com/entmootapp"],
};

// JSON-LD for WebPage
const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: SEO_CONFIG.title,
  description: SEO_CONFIG.description,
  url: SEO_CONFIG.url,
  mainEntity: {
    "@type": "SoftwareApplication",
    name: "Entmoot",
  },
  speakable: {
    "@type": "SpeakableSpecification",
    cssSelector: ["h1", "h2", ".hero-description"],
  },
};

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
        content="family goals, family goal setting app, family planner app, SMART goals for kids, family goal tracking, family organizer, daily planner, weekly review, family planning platform, gamification for families, COPPA compliant, family productivity"
      />

      {/* Pricing specific meta */}
      <meta name="product:price:amount" content="149" />
      <meta name="product:price:currency" content="USD" />

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(softwareApplicationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(organizationSchema)}
      </script>
      <script type="application/ld+json">
        {JSON.stringify(webPageSchema)}
      </script>
    </Helmet>
  );
}
