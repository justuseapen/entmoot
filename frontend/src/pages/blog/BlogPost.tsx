import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { HERITAGE_COLORS } from "@/components/landing/design-system";
import { LandingNav } from "@/components/landing/LandingNav";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { blogPosts } from "./BlogIndex";
import type { BlogPostMeta } from "./BlogIndex";
import { STRIPE_PAYMENT_LINK, PRICE_DISPLAY } from "@/config/pricing";

// Blog post content - in production, this could be loaded from markdown files
const blogContent: Record<string, string> = {
  "complete-guide-family-goal-setting": `
## Why Family Goal Setting Matters

In today's busy world, families often find themselves running in different directions. Between work, school, extracurriculars, and social commitments, it's easy to lose sight of what truly matters: growing together as a unit.

Family goal setting isn't just about productivity—it's about creating shared purpose and building deeper connections with the people you love most.

### The Power of Shared Goals

When families set goals together, something magical happens. Children learn that their voice matters. Parents model healthy planning behaviors. And everyone develops a shared vocabulary for talking about dreams and challenges.

Research shows that families who regularly discuss and work toward shared goals report:
- Higher levels of family satisfaction
- Better communication between parents and children
- Increased sense of belonging for all family members
- More effective problem-solving as a unit

## The SMART Framework for Families

You've probably heard of SMART goals in a professional context, but they work beautifully for families too:

### Specific
Instead of "spend more time together," try "have a family game night every Saturday."

### Measurable
"Read more books" becomes "read 2 books per month as a family."

### Achievable
Consider everyone's schedules and abilities. A goal that's too ambitious will discourage everyone.

### Relevant
Goals should connect to your family's values. What matters most to YOUR family?

### Time-bound
Set clear deadlines. "By summer vacation" or "before Grandma's birthday."

## Getting Started: Your First Family Meeting

The best time to start is now. Here's a simple agenda for your first family goal-setting meeting:

1. **Open with appreciation** (5 minutes) - Each person shares one thing they're grateful for about the family.

2. **Dream together** (10 minutes) - What would make this year amazing? No idea is too big or too small.

3. **Choose one goal** (10 minutes) - For your first time, pick just ONE family goal that everyone is excited about.

4. **Break it down** (10 minutes) - What's the first small step you can take this week?

5. **Close with commitment** (5 minutes) - Everyone states what they'll do to contribute.

## Common Pitfalls to Avoid

### Don't overcommit
One well-executed goal beats ten abandoned ones.

### Don't exclude younger children
Even toddlers can participate at their level. Let them color a goal chart or choose between options.

### Don't skip celebrations
Every milestone deserves recognition, no matter how small.

### Don't give up after setbacks
Missed a week? Just pick up where you left off. Progress isn't linear.

## Ready to Transform Your Family?

Family goal setting is a skill that improves with practice. Start small, stay consistent, and watch as your family transforms from a group of individuals into a true team.

The journey of a thousand miles begins with a single step—or in this case, a single family meeting.
  `,
  "how-to-run-family-meetings": `
## The Family Meeting Revolution

Remember the last time your family had a really productive conversation about plans, goals, or challenges? If you're struggling to recall one, you're not alone.

Most families default to chaotic car conversations, distracted dinner discussions, or frustrated outbursts when things go wrong. There's a better way: the structured family meeting.

### Why Structure Matters

"But we talk all the time!" you might say. And that's true—but talking isn't the same as communicating with purpose.

A structured family meeting provides:
- **Dedicated time** where everyone knows to show up ready to engage
- **Equal voice** for every family member, regardless of age
- **Clear outcomes** so meetings feel productive, not frustrating
- **Predictable rhythm** that builds trust and participation over time

## The Anatomy of a Great Family Meeting

### Timing: When to Meet

Most successful families meet weekly, typically on Sunday evenings or Saturday mornings. Choose a time when:
- Everyone is home
- Energy levels are reasonable (not right before bed)
- There's no competing priority (not during the big game)

### Duration: Keep It Tight

- **With young children (under 7):** 15-20 minutes maximum
- **With school-age kids:** 20-30 minutes
- **With teens:** 30-45 minutes

Shorter and more frequent beats long and irregular every time.

### Location: Create Sacred Space

Pick a consistent spot. The kitchen table works for most families. Some families create a special "meeting spot" with cushions in the living room.

The key is consistency—same time, same place, same format.

## A Sample Agenda That Works

### 1. Appreciations (3-5 minutes)
Go around and have each person share one appreciation for another family member. This sets a positive tone.

*"I appreciate Dad for helping me with my science project."*
*"I appreciate Maya for being patient when I was learning to ride my bike."*

### 2. Calendar Review (5-7 minutes)
Look at the week ahead. What's happening? Who needs to be where? Any potential conflicts?

### 3. Old Business (3-5 minutes)
Check in on any commitments from last week. Did we follow through on our plans?

### 4. New Business (5-10 minutes)
This is where new topics are raised:
- Problems to solve
- Decisions to make together
- Goals to set or adjust

### 5. Fun Planning (3-5 minutes)
Always end with something to look forward to. What's one fun thing we'll do this week?

### 6. Closing (2 minutes)
A family cheer, a group hug, or a simple "thanks for meeting!"

## Making It Kid-Friendly

### For Toddlers and Preschoolers
- Keep it to 10 minutes max
- Use visual aids and pictures
- Let them hold a special "talking object"
- Include a song or movement break

### For Elementary Ages
- Give them a rotating job (note-taker, timekeeper)
- Let them suggest agenda items
- Use a whiteboard for visual tracking
- Celebrate their contributions

### For Teens
- Genuinely value their input
- Be flexible on the format
- Connect meetings to privileges they care about
- Give them leadership opportunities

## When Things Go Wrong

### Someone won't participate
Don't force it. Keep meetings positive. Their silence is still presence.

### Meetings turn into fights
Table heated topics for a separate conversation. Keep meetings safe.

### You miss a week
Just restart. No guilt, no makeup sessions. Consistency over perfection.

### Kids say it's "boring"
Shorten it, add more fun elements, and make sure their voices are actually being heard.

## The Long-Term Payoff

Families who maintain regular meetings for a year or more report transformative changes:

- Kids learn to advocate for themselves respectfully
- Parents become better listeners
- Conflicts get resolved before they escalate
- Everyone feels more connected and valued

It takes about 6-8 weeks for family meetings to feel natural. Push through the awkward phase—the rewards are worth it.

Your family has the potential to be an incredible team. Regular meetings are how you unlock it.
  `,
  "why-we-built-entmoot": `
## A Dad's Confession

I built Entmoot because I was failing at the thing that mattered most to me: being present with my family.

My name is Justus, and I'm the founder of Entmoot. I'm also a dad of two amazing kids and a husband to my best friend. On paper, I had everything. In reality, I was drowning.

### The Breaking Point

It was a Tuesday evening—one of those evenings that blur into every other evening. I was on my phone, half-listening to my 7-year-old talk about her day, when she stopped mid-sentence.

"Daddy, are you even listening?"

I wasn't. I was checking Slack. Again.

That moment broke something in me—and started something new.

### The Problem I Couldn't Solve

Over the following weeks, I tried everything:
- Shared family calendars (too clinical)
- Chore apps (made everything transactional)
- Paper planners (nobody used them)
- Regular family meetings (kept forgetting to have them)

Nothing stuck because nothing was designed for how families actually work. Everything was either:
1. Built for productivity-obsessed adults, or
2. So gamified it felt like bribery

I wanted something that treated my family like what it is: a team on a shared mission.

### The Tree Metaphor

One night, while reading to my kids, I came across a passage about trees. How their roots connect underground. How the whole forest shares nutrients.

That's when it clicked.

A family isn't a task list. It's a living system. Daily tasks are like leaves—they come and go. But they need to connect to branches (weekly goals), which connect to the trunk (monthly themes), which connect to roots (annual dreams and values).

**Multi-scale planning.** That's what families need.

### Building Something Different

I started building Entmoot in the evenings after my kids went to bed. Every feature was tested at my own kitchen table:

- Does the morning planning ritual actually work for sleepy kids?
- Can my 7-year-old understand the goal tree?
- Will my teen actually engage with this, or roll her eyes?

The answers shaped everything.

### What Makes Entmoot Different

**It's built for families, not individuals.** Every screen, every feature, every interaction is designed for a group of people at different ages and stages.

**It connects scales.** Your daily tasks aren't floating in a void—they visibly connect to your bigger family dreams.

**It celebrates together.** When someone achieves a goal, the whole family can see it and cheer.

**It's safe for kids.** COPPA compliant, age-appropriate roles, no dark patterns.

### The Name

"Entmoot" comes from Tolkien. It's the gathering of the Ents—ancient tree beings who come together to make important decisions. They're slow and deliberate, but when they act, it's powerful.

That's what a family meeting should be. A gathering of different voices, different ages, different perspectives—all coming together to decide what matters.

### Where We Are Now

Today, I still use Entmoot with my own family. We have our Sunday meetings. We set goals together. We celebrate wins.

Is it perfect? No. But we're a team now. When I'm on my phone during dinner, my daughter doesn't ask if I'm listening—she knows I'm probably logging a completed goal.

### An Invitation

I'm not building this to get rich. I'm building it because I believe families can be the most important teams in the world—if they have the right tools.

That's why we're offering a Founding Family deal. We need families like yours to help us shape this product into something truly special.

If you're a parent who's felt that same drowning feeling, I want you to know: it can get better. And I'd be honored if Entmoot could help.

— Justus
Founder, Entmoot
  `,
  "multi-scale-planning-guide": `
## The Problem with Traditional Planning

Most planning systems have a fatal flaw: they only work at one scale.

Your to-do app is great for daily tasks, but it doesn't connect them to anything bigger. Your vision board is inspiring, but it doesn't tell you what to do on Monday morning.

Multi-scale planning bridges that gap. It's the secret weapon of high-performing families.

### What Is Multi-Scale Planning?

Multi-scale planning is a framework where actions at one level explicitly connect to goals at the next level. Think of it as nested containers:

**Annual → Quarterly → Monthly → Weekly → Daily**

Each level informs and supports the others.

### Why It Works for Families

Families are uniquely suited for multi-scale planning because:

1. **You have built-in accountability partners** - family members can remind and encourage each other
2. **Kids need to see the "why"** - connecting chores to bigger goals gives them meaning
3. **Seasons and school years provide natural rhythms** - quarterly planning aligns with how families already think

## The Five Scales Explained

### Annual (The Roots)
Your family's annual goals are like the roots of a tree—deep, stable, foundational.

Questions to ask:
- What kind of family do we want to be this year?
- What's one big experience we want to have together?
- What values do we want to strengthen?

*Example: "Become a more active, outdoor family"*

### Quarterly (The Trunk)
Quarterly goals break annual dreams into manageable chunks. They align with school terms, seasons, and natural family rhythms.

*Example: "This spring, go hiking twice a month"*

### Monthly (The Branches)
Monthly goals get specific. They're concrete enough to plan for, but flexible enough to adjust.

*Example: "In March, research and visit three new hiking trails"*

### Weekly (The Twigs)
Weekly planning is where rubber meets road. These are your actual commitments.

*Example: "This week: Research trails Saturday morning, hike Sunday afternoon"*

### Daily (The Leaves)
Daily tasks are the visible actions. They grow, fall, and renew—but they're always connected to something bigger.

*Example: "Today: Pack hiking snacks, check weather forecast"*

## Implementing Multi-Scale Planning

### Step 1: Start at the Annual Level

Once a year (January or September works for most families), have a longer family meeting to discuss the year ahead.

Each person answers:
- What are you most excited about this year?
- What's one thing you want to learn or achieve?
- What do you want more of in our family?

From this discussion, identify 3-5 annual family goals.

### Step 2: Quarterly Check-ins

Every three months, review your annual goals and set quarterly milestones.

Ask:
- Are we on track?
- What should we focus on this quarter?
- Any goals need adjustment?

### Step 3: Monthly Planning

At the start of each month, get more specific.

- What's happening this month? (Events, trips, deadlines)
- What monthly goal will move us toward our quarterly target?
- Who owns what?

### Step 4: Weekly Reviews

This is your regular family meeting rhythm. Every week:

- Celebrate last week's wins
- Review the calendar
- Set specific goals for the week
- Assign tasks

### Step 5: Daily Touch-Points

Keep it light. Morning: What's the plan? Evening: How did we do?

This doesn't need to be a formal meeting—just a quick check-in.

## Making It Visual

The key to multi-scale planning with families is making it visible. Kids (and adults) need to SEE the connections.

Options:
- **Goal Tree poster** - Annual at the roots, daily at the leaves
- **Digital dashboard** - Entmoot's goal tree feature shows this visually
- **Whiteboard wall** - A dedicated space for family goals

## Common Questions

### Isn't this too complicated for kids?

Nope! Kids actually love seeing how their daily actions connect to bigger goals. It gives meaning to chores and tasks that otherwise feel arbitrary.

### How rigid should we be?

Think of it as a compass, not a prison. The framework guides you, but flexibility is built in. Life happens—adjust accordingly.

### What if we miss a level?

Start where you can. Even just connecting daily tasks to weekly goals is transformative.

## The Transformation

Families who practice multi-scale planning report:
- Less "why do I have to do this?" from kids
- More buy-in on family goals
- Increased sense of progress and purpose
- Better follow-through on commitments

Your daily tasks might feel small. But when you can see how they connect to your family's biggest dreams, everything changes.

That's the power of multi-scale planning.
  `,
  "age-appropriate-goals-for-kids": `
## Why Age Matters in Goal Setting

A common mistake parents make: expecting the same type of goal-setting from a 5-year-old and a 15-year-old.

Development matters. A child's brain, emotional regulation, time perception, and motivation systems are all dramatically different at different ages.

This guide will help you set goals that meet your kids where they are.

## Ages 3-5: The Foundation Years

### What They Can Understand
- Immediate cause and effect
- Simple, concrete tasks
- Visual progress (stickers, checkmarks)
- Today and "lots of sleeps" (very rough time concept)

### Goal Examples
- "Put your shoes in the shoe spot when you come inside"
- "Use kind words at the playground today"
- "Try one bite of a new food at dinner"

### Best Practices
- **Keep it visual:** Sticker charts are perfect
- **Focus on single days:** "Today" goals only
- **Celebrate immediately:** Reward follows action closely
- **Keep it simple:** One goal at a time

## Ages 6-8: Building Blocks

### What They Can Understand
- Days of the week
- Simple sequences (first this, then that)
- Working toward something
- Pride in accomplishment

### Goal Examples
- "Read for 15 minutes every day this week"
- "Practice piano 3 times before Saturday lesson"
- "Save allowance for 4 weeks for new toy"

### Best Practices
- **Weekly goals become possible:** But keep them short-term
- **Connect action to outcome:** "If you practice, you'll be ready for the recital"
- **Give them ownership:** Let them choose between goal options
- **Visual tracking still works:** Goal charts, progress bars

## Ages 9-11: Growing Independence

### What They Can Understand
- Monthly timeframes
- Breaking big goals into steps
- Personal responsibility
- Consequences of choices

### Goal Examples
- "Finish science project by the 15th (here's a checklist)"
- "Run a 10-minute mile by end of soccer season"
- "Save half my allowance for three months for bike"

### Best Practices
- **Teach planning skills:** Help them break goals into steps
- **Monthly goals are achievable:** With weekly check-ins
- **Natural consequences:** If they don't meet a goal, let them feel it
- **Give them a voice:** Include them in family goal discussions meaningfully

## Ages 12-14: The Middle School Transition

### What They Can Understand
- Quarterly and semester timeframes
- Abstract goals (improving relationships, building character)
- Long-term consequences
- Self-assessment

### Goal Examples
- "Raise math grade from C to B by end of quarter"
- "Make one new friend this semester"
- "Complete community service hours by May"

### Best Practices
- **Respect their autonomy:** Ask questions instead of dictating
- **Connect to their interests:** Goals they care about stick
- **Natural accountability:** Let them experience consequences
- **Private goals are okay:** Not everything needs to be shared with family

## Ages 15-17: Approaching Adulthood

### What They Can Understand
- Year-long timeframes
- Life planning concepts (college, career)
- Complex cause and effect
- Self-directed improvement

### Goal Examples
- "Research five colleges by winter break"
- "Save $500 for summer trip"
- "Build portfolio for art school applications"
- "Develop a consistent workout habit"

### Best Practices
- **Mentor, don't manage:** Offer guidance, not control
- **Real-world connections:** Goals should feel relevant to their future
- **Financial literacy:** Include money goals
- **Let them fail:** Sometimes that's the best teacher

## Adjusting for Individual Kids

Age is just a starting point. Consider:

### Executive Function
Some kids develop planning skills earlier than others. Adjust complexity accordingly.

### Learning Differences
ADHD, dyslexia, and other differences affect how kids interact with goals. Work with their strengths.

### Emotional Maturity
A highly anxious child might need smaller, more achievable goals. A confident kid might handle bigger challenges.

### Interests
Kids engage more with goals connected to what they care about.

## The Family Goal Dynamic

When setting family goals, remember:
- Youngest members set the complexity ceiling for shared goals
- Older kids can have additional personal goals
- Everyone should have a role they can succeed in
- Comparison between siblings kills motivation

## Red Flags to Watch For

- **Goal avoidance:** May indicate fear of failure or goals that are too hard
- **Losing interest quickly:** Goals might be too long-term or not meaningful
- **Excessive perfectionism:** Goals might need to be lower stakes
- **Consistent failure:** Something's wrong—investigate with curiosity

## The Long View

The goal of goal-setting isn't really about achieving specific things. It's about teaching your kids a life skill.

Kids who learn to:
- Set realistic goals
- Make plans
- Track progress
- Adjust when things don't work
- Celebrate success

...become adults who can do the same. That's the real win.

Meet your kids where they are, and watch them grow into the people they're meant to be.
  `,
  "lifetime-deal-vs-subscription": `
## The Subscription Problem

Let's be honest: subscription fatigue is real.

Netflix, Spotify, cloud storage, meal kits, gym memberships, news apps, meditation apps, productivity tools... the list never ends.

The average American household now spends over $200/month on subscriptions. That's $2,400 a year just to access things we used to own outright.

When we built Entmoot, we had a choice to make.

### The Easy Path: Subscriptions

From a business perspective, subscriptions are attractive:
- Predictable recurring revenue
- Higher lifetime customer value
- Easier to report to investors

Most SaaS companies don't even consider alternatives.

### The Harder Path: Lifetime Deals

A lifetime deal means one payment, permanent access. It's:
- Riskier for the business
- Requires upfront trust from customers
- Harder to forecast

So why did we choose it?

## Why We Chose the Lifetime Model

### Reason 1: Families Think in Generations

Subscriptions make sense for things that change constantly. But a family planning tool? You want it to be there for years—possibly decades.

When your kids grow up and have kids of their own, we want Entmoot to still be there. That's a commitment that requires a different business model.

### Reason 2: No Perverse Incentives

Subscription businesses often have misaligned incentives:
- They need to keep you "engaged" (sometimes through dark patterns)
- They can raise prices whenever they want
- They may prioritize features that increase stickiness over usefulness

With a lifetime deal, our incentive is simple: build something so good you tell your friends.

### Reason 3: Skin in the Game

When you make a one-time purchase, you're betting on us. And we're betting on ourselves.

This creates healthy pressure to:
- Build a product that's worth the investment
- Maintain it properly for years
- Not nickel-and-dime you with add-ons

### Reason 4: Families Deserve Value

Most family apps are either free-with-ads (which means your data is the product) or subscription-based (which adds up fast).

We wanted to offer genuine value. $249 once for a tool your family uses for years? That's the kind of deal we'd want for our own families.

## The Math: Lifetime vs. Subscription

Let's compare Entmoot to typical family productivity tools:

| Tool | Annual Cost | 5-Year Cost | 10-Year Cost |
|------|------------|-------------|--------------|
| Cozi Premium | $29/year | $145 | $290 |
| Notion Family | $96/year | $480 | $960 |
| Todoist Premium | $48/year | $240 | $480 |
| **Entmoot LTD** | **$249 once** | **$249** | **$249** |

After about 18 months, Entmoot's lifetime deal pays for itself compared to most alternatives. After that, it's pure savings.

## Frequently Asked Questions

### What if you go out of business?

Valid concern. Here's our commitment:
1. We're building sustainably, not chasing rapid growth
2. If we ever shut down, we'll provide data export and source code
3. Our founding families are our most important community—we won't abandon you

### Will lifetime users be treated as second-class?

Absolutely not. Lifetime users are our foundation. You'll get:
- All feature updates forever
- Priority support
- Direct influence on our roadmap

### What about future pricing?

Our $249 Founding Family price is limited. Once we hit 500 families, we'll:
1. Move to a subscription model for new users
2. Keep lifetime users grandfathered forever
3. Possibly offer limited LTD windows in the future (at higher prices)

### Is this sustainable for you?

Yes, because:
- We're bootstrapped with low overhead
- We're not chasing unicorn growth
- One-time revenue funds development; word-of-mouth drives growth
- We may offer paid add-ons in the future (but the core will always be included)

## The Founding Family Proposition

By purchasing a Founding Family lifetime deal, you get:
- **Permanent access** to Entmoot and all future updates
- **Unlimited family members** (no per-seat pricing)
- **Founding Family badge** on your profile forever
- **Direct access** to the founder for feedback and feature requests
- **Priority support** for life

And you help us build something that lasts.

## Is It Right for You?

A lifetime deal makes sense if:
- You're committed to intentional family planning
- You want predictable costs with no surprises
- You believe in supporting independent developers
- You're willing to help shape a product with feedback

It might NOT be right if:
- You're not sure you'll use it
- You prefer month-to-month flexibility
- You want a fully mature product with no rough edges

## Our Promise

We're building Entmoot for the long haul. Not for a quick exit. Not for investors. For families like ours and yours.

A lifetime deal isn't just a pricing model—it's a commitment. We're committed to you. And we're asking you to commit to us.

Ready to join the Founding Families?
  `,
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// Generate article schema for SEO
function generateArticleSchema(post: BlogPostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: "Justus Eapen",
    },
    publisher: {
      "@type": "Organization",
      name: "Entmoot",
      url: "https://entmoot.app",
    },
  };
}

export function BlogPost() {
  const { slug } = useParams<{ slug: string }>();

  const post = blogPosts.find((p) => p.slug === slug);
  const content = slug ? blogContent[slug] : null;

  if (!post || !content) {
    return <Navigate to="/blog" replace />;
  }

  const articleSchema = generateArticleSchema(post);

  return (
    <>
      <Helmet>
        <title>{post.title} | Entmoot Blog</title>
        <meta name="description" content={post.description} />
        <link rel="canonical" href={`https://entmoot.app/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.description} />
        <meta property="og:type" content="article" />
        <meta property="article:published_time" content={post.date} />
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>

      <div
        className="min-h-screen"
        style={{ backgroundColor: HERITAGE_COLORS.parchment }}
      >
        <LandingNav />

        <main className="pt-24 pb-16">
          <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            {/* Back link */}
            <Link
              to="/blog"
              className="mb-8 inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
              style={{ color: HERITAGE_COLORS.deepForest }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Blog
            </Link>

            {/* Article header */}
            <header className="mb-8">
              <span
                className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-medium"
                style={{
                  backgroundColor: `${HERITAGE_COLORS.antiqueGold}20`,
                  color: HERITAGE_COLORS.deepForest,
                }}
              >
                {post.category}
              </span>

              <h1
                className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl"
                style={{
                  color: HERITAGE_COLORS.charcoal,
                  fontFamily: "'Georgia', serif",
                }}
              >
                {post.title}
              </h1>

              <p
                className="mb-6 text-lg leading-relaxed"
                style={{ color: HERITAGE_COLORS.sepia }}
              >
                {post.description}
              </p>

              <div
                className="flex flex-wrap items-center gap-4 border-b pb-6 text-sm"
                style={{
                  color: HERITAGE_COLORS.sepia,
                  borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
                }}
              >
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
                <button
                  onClick={() => {
                    navigator.share?.({
                      title: post.title,
                      url: window.location.href,
                    });
                  }}
                  className="flex items-center gap-1 transition-colors hover:opacity-80"
                  style={{ color: HERITAGE_COLORS.deepForest }}
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              </div>
            </header>

            {/* Article content */}
            <div
              className="prose prose-lg max-w-none"
              style={
                {
                  "--tw-prose-body": HERITAGE_COLORS.sepia,
                  "--tw-prose-headings": HERITAGE_COLORS.charcoal,
                  "--tw-prose-links": HERITAGE_COLORS.deepForest,
                  "--tw-prose-bold": HERITAGE_COLORS.charcoal,
                } as React.CSSProperties
              }
            >
              {content.split("\n").map((paragraph, index) => {
                const trimmed = paragraph.trim();
                if (!trimmed) return null;

                if (trimmed.startsWith("## ")) {
                  return (
                    <h2
                      key={index}
                      className="mt-8 mb-4 text-2xl font-bold"
                      style={{
                        color: HERITAGE_COLORS.charcoal,
                        fontFamily: "'Georgia', serif",
                      }}
                    >
                      {trimmed.replace("## ", "")}
                    </h2>
                  );
                }

                if (trimmed.startsWith("### ")) {
                  return (
                    <h3
                      key={index}
                      className="mt-6 mb-3 text-xl font-semibold"
                      style={{ color: HERITAGE_COLORS.charcoal }}
                    >
                      {trimmed.replace("### ", "")}
                    </h3>
                  );
                }

                if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
                  return (
                    <li
                      key={index}
                      className="ml-6"
                      style={{ color: HERITAGE_COLORS.sepia }}
                    >
                      {trimmed.replace(/^[-*] /, "")}
                    </li>
                  );
                }

                if (trimmed.startsWith("*") && trimmed.endsWith("*")) {
                  return (
                    <p
                      key={index}
                      className="my-4 italic"
                      style={{ color: HERITAGE_COLORS.sepia }}
                    >
                      {trimmed.replace(/^\*|\*$/g, "")}
                    </p>
                  );
                }

                if (trimmed.startsWith("|")) {
                  return null; // Skip table formatting for now
                }

                return (
                  <p
                    key={index}
                    className="my-4 leading-relaxed"
                    style={{ color: HERITAGE_COLORS.sepia }}
                    dangerouslySetInnerHTML={{
                      __html: trimmed
                        .replace(
                          /\*\*(.+?)\*\*/g,
                          `<strong style="color: ${HERITAGE_COLORS.charcoal}">$1</strong>`
                        )
                        .replace(/\*(.+?)\*/g, "<em>$1</em>"),
                    }}
                  />
                );
              })}
            </div>

            {/* CTA section */}
            <div
              className="mt-12 rounded-xl border p-8 text-center"
              style={{
                backgroundColor: HERITAGE_COLORS.cream,
                borderColor: `${HERITAGE_COLORS.antiqueBrass}30`,
              }}
            >
              <h3
                className="mb-2 text-xl font-semibold"
                style={{
                  color: HERITAGE_COLORS.charcoal,
                  fontFamily: "'Georgia', serif",
                }}
              >
                Ready to start your family's journey?
              </h3>
              <p
                className="mb-6"
                style={{ color: HERITAGE_COLORS.sepia }}
              >
                Join the Founding Families and get lifetime access to Entmoot.
              </p>
              <a
                href={STRIPE_PAYMENT_LINK}
                className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
                style={{ backgroundColor: HERITAGE_COLORS.deepForest }}
              >
                Get Lifetime Access - {PRICE_DISPLAY}
              </a>
            </div>
          </article>
        </main>

        <LandingFooter />
      </div>
    </>
  );
}
