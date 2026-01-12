import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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

// FAQ data per PRD acceptance criteria
const faqItems = [
  {
    id: "faq-1",
    question: "Is Entmoot safe for kids?",
    answer:
      "Absolutely! Entmoot is designed with family safety as a top priority. We're fully COPPA compliant for children under 13. Our role-based permissions system lets parents control exactly what each family member can see and do. Children and teens have age-appropriate access, while admins maintain full control over family settings and data.",
  },
  {
    id: "faq-2",
    question: "Can I use Entmoot for just myself?",
    answer:
      "Yes! While Entmoot shines brightest with families, it works wonderfully for solo adventurers too. You can use all the goal-setting, daily planning, and reflection features on your own. Many users start solo and invite family members later when they're ready to share their planning journey.",
  },
  {
    id: "faq-3",
    question: "What happens to my data?",
    answer:
      "Your data belongs to you, always. We never sell your personal information to third parties. You can export all your data anytime from your account settings. We use industry-standard encryption to protect your information, and our servers are hosted securely in the United States.",
  },
  {
    id: "faq-4",
    question: "Do I need to download an app?",
    answer:
      "Entmoot is web-based, so you can access it from any browser on your phone, tablet, or computer. No downloads required to get started! That said, we're working on native iOS and Android apps that will offer push notifications and offline access. They're coming soon!",
  },
  {
    id: "faq-5",
    question: "Can grandparents or babysitters join?",
    answer:
      "Absolutely! You can invite extended family, caregivers, or anyone who helps with your family as Observers. Observers can view family goals and activities without being able to modify anything. It's perfect for keeping everyone in the loop while maintaining control over who can make changes.",
  },
  {
    id: "faq-6",
    question: "What if my family doesn't stick with it?",
    answer:
      "We've designed Entmoot with built-in motivation! Our gamification features like streaks, badges, and family leaderboards make planning fun rather than a chore. Kids especially love earning rewards. But if it's not working out, you can cancel anytime with no questions asked. We also offer a streak freeze feature (coming soon) for those vacation weeks!",
  },
];

export function FAQSection() {
  return (
    <section
      id="faq"
      className="py-16 sm:py-20 lg:py-24"
      style={{ backgroundColor: LANDING_COLORS.creamWhite }}
    >
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Section headline */}
        <div className="mb-12 text-center lg:mb-16">
          <h2
            className="text-3xl font-bold sm:text-4xl lg:text-5xl"
            style={{ color: LANDING_COLORS.darkForest }}
          >
            Questions from the Council
          </h2>
        </div>

        {/* FAQ Accordion */}
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item) => (
            <AccordionItem
              key={item.id}
              value={item.id}
              className="border-b"
              style={{ borderColor: `${LANDING_COLORS.earthBrown}30` }}
            >
              <AccordionTrigger
                className="py-5 text-left text-base font-semibold hover:no-underline sm:text-lg"
                style={{ color: LANDING_COLORS.darkForest }}
              >
                {item.question}
              </AccordionTrigger>
              <AccordionContent
                className="text-base leading-relaxed"
                style={{ color: LANDING_COLORS.earthBrown }}
              >
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
