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
    question: "What exactly do I get with the Founding Family Edition?",
    answer: `You get lifetime access to Entmoot for a one-time payment of ${PRICE_DISPLAY} (normally ${REGULAR_PRICE_DISPLAY}). This includes unlimited family members, AI goal coaching powered by Claude, all badge collections, multi-scale reviews from daily to annual, calendar sync with Google/Apple/Outlook, COPPA compliance for kids, and all future updates. No monthly fees, ever.`,
  },
  {
    id: "faq-2",
    question: "Is there really no subscription? What's the catch?",
    answer:
      "No catch! We're offering this Founding Family deal to get early adopters who will help us shape the product with feedback. Once we hit 500 families, this offer ends and we'll move to a subscription model. You'll be grandfathered in with lifetime access.",
  },
  {
    id: "faq-4",
    question: "Is Entmoot safe for kids?",
    answer:
      "Yes! Entmoot is designed with family safety as a top priority. We're fully COPPA compliant for children under 13. Our role-based permissions system lets parents control exactly what each family member can see and do. Children and teens have age-appropriate access, while admins maintain full control over family settings and data.",
  },
  {
    id: "faq-5",
    question: "Can grandparents or babysitters join?",
    answer:
      "Absolutely! You can invite extended family, caregivers, or anyone who helps with your family as Observers. Observers can view family goals and activities without being able to modify anything. It's perfect for keeping everyone in the loop while maintaining control over who can make changes.",
  },
  {
    id: "faq-6",
    question: "What happens to my data?",
    answer:
      "Your data belongs to you, always. We never sell your personal information to third parties. You can export all your data anytime from your account settings. We use industry-standard encryption to protect your information, and our servers are hosted securely in the United States.",
  },
  {
    id: "faq-7",
    question: "Do I need to download an app?",
    answer:
      "Entmoot is web-based, so you can access it from any browser on your phone, tablet, or computer. No downloads required to get started! That said, we're working on native iOS and Android apps that will offer push notifications and offline access. They're coming soon!",
  },
  {
    id: "faq-8",
    question: "What if my family doesn't stick with it?",
    answer:
      "We've designed Entmoot with built-in motivation! Our gamification features like streaks, badges, and family leaderboards make planning fun rather than a chore. Kids especially love earning rewards.",
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
              className="mb-3 text-sm font-medium uppercase tracking-wider"
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
