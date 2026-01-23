import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { HERITAGE_COLORS } from "@/components/landing/design-system";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";

// Blog post metadata type
export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
}

// Static blog posts data - in production, this could come from an API or CMS
export const blogPosts: BlogPostMeta[] = [
  {
    slug: "complete-guide-family-goal-setting",
    title: "The Complete Guide to Family Goal Setting",
    description:
      "Learn how to set meaningful goals as a family that everyone can work toward together. From daily habits to annual dreams.",
    date: "2026-01-15",
    readTime: "12 min read",
    category: "Goal Setting",
    featured: true,
  },
  {
    slug: "how-to-run-family-meetings",
    title: "How to Run Effective Family Meetings",
    description:
      "Transform chaotic family discussions into productive planning sessions that everyone looks forward to.",
    date: "2026-01-10",
    readTime: "8 min read",
    category: "Family Planning",
    featured: true,
  },
  {
    slug: "why-we-built-entmoot",
    title: "Why We Built Entmoot: A Founder's Story",
    description:
      "The personal journey from overwhelmed dad to building a family planning platform that helps families thrive.",
    date: "2026-01-05",
    readTime: "6 min read",
    category: "Company",
  },
  {
    slug: "multi-scale-planning-guide",
    title: "Multi-Scale Planning: From Daily Tasks to Annual Dreams",
    description:
      "How to connect your daily actions to your biggest family aspirations using multi-scale planning techniques.",
    date: "2026-01-01",
    readTime: "10 min read",
    category: "Planning",
  },
  {
    slug: "age-appropriate-goals-for-kids",
    title: "Age-Appropriate Goals: What to Expect from Kids 5-17",
    description:
      "A comprehensive guide to setting developmentally appropriate goals for children at every age.",
    date: "2025-12-28",
    readTime: "9 min read",
    category: "Parenting",
  },
  {
    slug: "lifetime-deal-vs-subscription",
    title: "Lifetime Deal vs. Subscription: What's Right for Your Family?",
    description:
      "Understanding the economics of lifetime deals and why we chose this model for Entmoot.",
    date: "2025-12-20",
    readTime: "5 min read",
    category: "Company",
  },
];

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function BlogCard({ post }: { post: BlogPostMeta }) {
  return (
    <article
      className="group flex flex-col rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1"
      style={{
        backgroundColor: HERITAGE_COLORS.cream,
        borderColor: `${HERITAGE_COLORS.antiqueBrass}25`,
      }}
    >
      {/* Category badge */}
      <span
        className="mb-3 w-fit rounded-full px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: `${HERITAGE_COLORS.antiqueGold}20`,
          color: HERITAGE_COLORS.deepForest,
        }}
      >
        {post.category}
      </span>

      {/* Title */}
      <Link to={`/blog/${post.slug}`}>
        <h2
          className="mb-2 text-xl font-semibold transition-colors group-hover:opacity-80 sm:text-2xl"
          style={{
            color: HERITAGE_COLORS.charcoal,
            fontFamily: "'Georgia', serif",
          }}
        >
          {post.title}
        </h2>
      </Link>

      {/* Description */}
      <p
        className="mb-4 flex-grow text-sm leading-relaxed sm:text-base"
        style={{ color: HERITAGE_COLORS.sepia }}
      >
        {post.description}
      </p>

      {/* Meta info */}
      <div className="mt-auto flex items-center justify-between">
        <div
          className="flex items-center gap-4 text-sm"
          style={{ color: HERITAGE_COLORS.sepia }}
        >
          <span className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            {formatDate(post.date)}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {post.readTime}
          </span>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="flex items-center gap-1 text-sm font-medium transition-colors hover:opacity-80"
          style={{ color: HERITAGE_COLORS.deepForest }}
        >
          Read more
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

function FeaturedPost({ post }: { post: BlogPostMeta }) {
  return (
    <article
      className="group rounded-xl border p-8 transition-all duration-300 hover:-translate-y-1 md:p-10"
      style={{
        backgroundColor: HERITAGE_COLORS.cream,
        borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
        boxShadow: "0 4px 20px rgba(28, 69, 50, 0.08)",
      }}
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:gap-8">
        <div className="flex-grow">
          {/* Featured badge */}
          <span
            className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: HERITAGE_COLORS.antiqueGold,
              color: HERITAGE_COLORS.charcoal,
            }}
          >
            Featured
          </span>

          {/* Title */}
          <Link to={`/blog/${post.slug}`}>
            <h2
              className="mb-3 text-2xl font-bold transition-colors group-hover:opacity-80 sm:text-3xl"
              style={{
                color: HERITAGE_COLORS.charcoal,
                fontFamily: "'Georgia', serif",
              }}
            >
              {post.title}
            </h2>
          </Link>

          {/* Description */}
          <p
            className="mb-4 text-base leading-relaxed sm:text-lg"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            {post.description}
          </p>

          {/* Meta info */}
          <div
            className="flex items-center gap-4 text-sm"
            style={{ color: HERITAGE_COLORS.sepia }}
          >
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(post.date)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </span>
          </div>
        </div>

        <Link
          to={`/blog/${post.slug}`}
          className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90 lg:mt-0"
          style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
        >
          Read Article
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}

export function BlogIndex() {
  const featuredPosts = blogPosts.filter((p) => p.featured);
  const regularPosts = blogPosts.filter((p) => !p.featured);

  return (
    <>
      <Helmet>
        <title>Blog | Entmoot - Family Planning Insights</title>
        <meta
          name="description"
          content="Expert advice on family goal setting, planning, and building intentional family cultures. Tips for parents and families."
        />
        <link rel="canonical" href="https://entmoot.app/blog" />
      </Helmet>

      <div
        className="min-h-screen"
        style={{ backgroundColor: HERITAGE_COLORS.parchment }}
      >
        <LandingNav />

        <main className="pt-24 pb-16">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <p
                className="mb-3 text-sm font-medium tracking-wider uppercase"
                style={{ color: HERITAGE_COLORS.antiqueGold }}
              >
                The Entmoot Blog
              </p>
              <h1
                className="mb-4 text-4xl font-bold sm:text-5xl"
                style={{
                  color: HERITAGE_COLORS.charcoal,
                  fontFamily: "'Georgia', serif",
                }}
              >
                Insights for Intentional Families
              </h1>
              <p
                className="mx-auto max-w-2xl text-lg"
                style={{ color: HERITAGE_COLORS.sepia }}
              >
                Expert advice on family goal setting, planning rituals, and
                building stronger family cultures.
              </p>
            </div>

            {/* Featured posts */}
            {featuredPosts.length > 0 && (
              <section className="mb-12">
                <div className="space-y-6">
                  {featuredPosts.map((post) => (
                    <FeaturedPost key={post.slug} post={post} />
                  ))}
                </div>
              </section>
            )}

            {/* All posts grid */}
            <section>
              <h2
                className="mb-6 text-xl font-semibold"
                style={{ color: HERITAGE_COLORS.charcoal }}
              >
                All Articles
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                {regularPosts.map((post) => (
                  <BlogCard key={post.slug} post={post} />
                ))}
              </div>
            </section>
          </div>
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
