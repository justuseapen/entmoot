import { Helmet } from "react-helmet-async";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { AnimatedSection } from "./AnimatedSection";
import { HERITAGE_COLORS } from "./design-system";
import { PRICE_DISPLAY, REGULAR_PRICE_DISPLAY } from "@/config/pricing";

// FAQ data per PRD acceptance criteria + LTD-specific questions
const faqItems = [
  {
    id: "faq-1",
    question: "Is this really based on Cal Newport's system?",
    answer:
      "Yes! The founder was inspired by Cal Newport's multi-scale planning philosophy from his books and Study Hacks blog. Entmoot adapts these proven productivity frameworks (time blocking, weekly reviews, quarterly planning, annual strategic planning) for family life. If you use these systems at work and want them at home, Entmoot is for you.",
  },
  {
    id: "faq-2",
    question: "What makes Entmoot different from Cozi or FamilyWall?",
    answer:
      "Cozi and FamilyWall are great for coordination (calendars, tasks, lists). Entmoot is for transformation. We add strategic planning, goal setting with AI coaching, weekly reviews, and multi-scale planning. Think of it as the layer above daily coordination—the 'why' behind the 'what.'",
  },
  {
    id: "faq-3",
    question: "What exactly do I get with the Founding Family Edition?",
    answer: `You get lifetime access to Entmoot for a one-time payment of ${PRICE_DISPLAY} (regular price: ${REGULAR_PRICE_DISPLAY}). This includes unlimited family members, AI goal coaching, all badge collections, multi-scale reviews from daily to annual, calendar sync with Google/Apple/Outlook, COPPA compliance for kids, and all future updates. No monthly fees, ever.`,
  },
  {
    id: "faq-4",
    question: "Will my family actually use it?",
    answer:
      "Great question. Entmoot works best when at least one adult is the 'champion' who drives adoption. Our onboarding, gamification, and weekly review structure help build habits. Kids especially love the badges and streaks. We also provide tips for getting family buy-in.",
  },
  {
    id: "faq-5",
    question: "How much time does it take?",
    answer:
      "15 minutes per week minimum for the weekly review. Plus 5-10 minutes daily for planning and check-ins. Less time than you spend scrolling Instagram—and way more valuable.",
  },
  {
    id: "faq-6",
    question: "What if I'm already using other tools?",
    answer:
      "Many families keep using Cozi or Google Calendar for scheduling and add Entmoot for strategic planning. They're complementary. Over time, some families consolidate everything into Entmoot.",
  },
  {
    id: "faq-7",
    question: "Is this just for big families?",
    answer:
      "No! Entmoot works for any family structure: nuclear, blended, single-parent, couples without kids, empty-nesters. If you want to be intentional about your life together, Entmoot is for you.",
  },
  {
    id: "faq-8",
    question: "What's the catch with lifetime access?",
    answer:
      "No catch. We're offering lifetime access to Founding Families because we want committed early adopters who'll help us build the product. Once we reach 100 families, this offer closes forever.",
  },
  {
    id: "faq-9",
    question: "What if I don't like it?",
    answer:
      "30-day money-back guarantee, no questions asked. But based on our internal testing, we're confident you'll see results in the first two weeks.",
  },
  {
    id: "faq-10",
    question: "Is my family's data private?",
    answer:
      "Absolutely. Your goals, reflections, and planning data are encrypted and private. We never sell data to advertisers. We make money from subscriptions, not your information.",
  },
];

// Generate FAQ Schema for JSON-LD
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export function FAQSection() {
  return (
    <>
      {/* FAQ Schema */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <AnimatedSection
        id="faq"
        className="py-16 sm:py-20 lg:py-24"
        style={{ backgroundColor: HERITAGE_COLORS.cream }}
      >
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          {/* Section headline */}
          <div className="mb-12 text-center lg:mb-16">
            <p
              className="mb-3 text-sm font-medium tracking-wider uppercase"
              style={{ color: HERITAGE_COLORS.antiqueGold }}
            >
              Common Questions
            </p>
            <h2
              className="text-3xl font-bold sm:text-4xl lg:text-5xl"
              style={{
                color: HERITAGE_COLORS.charcoal,
                fontFamily: "'Georgia', serif",
              }}
            >
              Frequently Asked Questions
            </h2>
            <p
              className="mt-4 text-lg"
              style={{ color: HERITAGE_COLORS.sepia }}
            >
              Everything you need to know about the Founding Family Edition
            </p>
          </div>

          {/* FAQ Accordion */}
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className="border-b"
                style={{ borderColor: `${HERITAGE_COLORS.antiqueBrass}30` }}
              >
                <AccordionTrigger
                  className="py-5 text-left text-base font-semibold hover:no-underline sm:text-lg"
                  style={{ color: HERITAGE_COLORS.charcoal }}
                >
                  {item.question}
                </AccordionTrigger>
                <AccordionContent
                  className="text-base leading-relaxed"
                  style={{ color: HERITAGE_COLORS.sepia }}
                >
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>
    </>
  );
}
