/**
 * Starter Memory FAQs. Public porch teaching — Dashaun Bryant (Roof Hustler)
 * and Adam Bensman (Roof Strategist). Not a licensed dump of a paid PDF.
 * Must stay in sync with /DOCTRINE.md.
 */
import type { NotionFaq } from "@/lib/notion-ids";

export const DEFAULT_FAQS: NotionFaq[] = [
  {
    id: "f_seed_mds",
    q: "What is the million-dollar door script?",
    a: "Retail / age. Dashaun Bryant’s public opener, told honest: “Hey — I’m [name] with [company]. I stopped by to see if you heard what’s been going on in the area.” They ask what’s going on. You tell the truth: “A lot of these houses are on the original roof from around [year]. That’s first-roof age. We’re doing free looks this week. Do you know what year this one went on?” Before the ladder: “We’d both agree this roof is at the age where it’s time to plan a replacement, right?” Close the hook with age + a free look. Do not invent a storm to finish the sentence. Storm talk only if Today has a logged storm that hit this street. This is the Live starter.",
  },
  {
    id: "f_seed_enroll",
    q: "Why “what’s been going on in the area”?",
    a: "Enrollment. Dashaun: get a small yes / a question back before you pitch. They say “no, what’s going on?” — they just stepped into the conversation. Then you present only to that. Never use the line as a fake-hail tease.",
  },
  {
    id: "f_seed_slap",
    q: "What is SLAP?",
    a: "Adam Bensman. In your head at every door: Say hi. Let them know why you stopped. Ask one open question. Present only to their answer. If the door is closing, cut to the L: “I’ll cut right to the chase,” then why you stopped.",
  },
  {
    id: "f_seed_openq",
    q: "What question do I ask at the door?",
    a: "Open, not yes/no. Bad: “Have you had your roof inspected?” They say no and you’re done. Better: “Do you know what year this roof went on?” or “When was the last time someone actually got on it?” Adam: closed questions kill the knock.",
  },
  {
    id: "f_seed_age",
    q: "Age first or storm first?",
    a: "Age first. Target original roofs in the years they set (default 17–25). Script A (claim talk) only after they Keep a storm and it matches that street. If Today has no weather, do not invent hail, a cell, or “we’re working next door.”",
  },
  {
    id: "f_seed_nextdoor",
    q: "Can I say we’re working next door?",
    a: "Only if it is true today, named, on this street. Fake neighbor is a lie. The million-dollar script does not need it.",
  },
  {
    id: "f_seed_selling",
    q: "They asked if we are selling something.",
    a: "Yes. “I am. Roofs. I’m not here to pitch you a number on the porch. I’m walking this zip because these houses are around [year] roofs. A free look this week if you want eyes on it.” Honesty first. Then one question: year of the roof.",
  },
  {
    id: "f_seed_busy",
    q: "Door is half closed / we’re busy.",
    a: "“Totally — I’ll cut right to the chase. These houses are around [year] roofs. Free look this week. I’ll leave my name and you can ignore it.” One breath. Then leave. Do not talk through a closing door.",
  },
  {
    id: "f_seed_guy",
    q: "They already have a guy.",
    a: "“Good. Keep him. I’m not here to rip that up. If you ever want a second set of photos, that’s all I do.” Name even on a no. Do not badmouth the other company.",
  },
  {
    id: "f_seed_think",
    q: "We need to think about it.",
    a: "Acknowledge first: “You want to think about it.” Then one question that books a real next look — spouse home, what they actually saw, morning or afternoon. Do not beg for a signature today. Delayed replacement is still a relationship.",
  },
  {
    id: "f_seed_price",
    q: "Your price is higher than the other guy.",
    a: "Restate it. Do not drop price on the porch. “The bottom number on mine is higher. That’s true.” Then gap: did they explain ice and water, valleys, who is on the warranty? Ask to present the three options from what they already agreed they saw.",
  },
  {
    id: "f_seed_denied",
    q: "Insurance already said no damage.",
    a: "Only if a real logged storm hit that street. “They said no. That happens.” Then: we document, the carrier decides, a claim can still be denied. Do not promise a flip. If there is no storm on Today, stay on age / retail.",
  },
  {
    id: "f_seed_agree",
    q: "What do I get them to agree before I go up?",
    a: "Age / condition when it’s true: “We’d both agree this roof is at the age where it’s time to plan a replacement, right?” Dashaun: once they say yes, the look is enrolled. Do not force it on a 2018 roof.",
  },
  {
    id: "f_seed_i35",
    q: "What is i35 after photos?",
    a: "After photos. Bad / Good / Worst — the good must be true. Then: Can you see this? How long / has anybody shown you? How does that make you feel? What would you like to do about it? Never WHY in the house. Do not announce findings off the ladder. On Inspect, he names the slot on the shot you just took.",
  },
  {
    id: "f_seed_why",
    q: "Why can’t I ask why in the house?",
    a: "WHY puts them on trial. Use “how does that make you feel” and “what would you like to do about it.” Save why for Presets, never the kitchen.",
  },
  {
    id: "f_seed_options",
    q: "What are the three options?",
    a: "After findings, from what THEY already agreed they saw: (1) insurance only if storm damage is actually on the roof — claims can be denied; (2) repair if it can be saved (in-house under about $1,500); (3) retail replacement if the system is at end of life. Ask to present before paper.",
  },
  {
    id: "f_seed_set",
    q: "When do I set the appointment?",
    a: "Before the driveway. [Day] morning or [day] afternoon. Both decision-makers. Goal of a knock is conversation → look → age/condition agreement when true → a set → a name even on a no. Not a porch signature as the default.",
  },
  {
    id: "f_seed_no",
    q: "Should I be afraid of no?",
    a: "Dashaun: no is the second-best answer. If something will kill the deal, get it out early. Example on a claim path: “The average deductible is a few thousand dollars. Are you comfortable with that before we go further?” If no, leave clean. Don’t hunt a maybe all night.",
  },
  {
    id: "f_seed_knock",
    q: "Knock or ring?",
    a: "Knock. Dashaun’s public rule: knock over the doorbell unless the house makes a knock impossible. Be a person at the door, not a delivery ping.",
  },
  {
    id: "f_seed_admit",
    q: "What do I admit up front?",
    a: "Adam, saturated markets: honesty, then transparency, then authenticity. Damaging admissions: a claim can be denied; walking a roof has risk; do not sign unread paper. Carrier decides. We document. We do not control approval.",
  },
  {
    id: "f_seed_english",
    q: "How simple should the homeowner line be?",
    a: "5th-grade for anything they will hear. Plain meaning first, then the roof word. “The sticky strip on the shingle did not grab. That is the seal strip.” Coach talk in the truck can sound like a closer.",
  },
  {
    id: "f_seed_win",
    q: "What is a winning day?",
    a: "One appointment from a day of knocking is a winning day. Empty doors with zero roofs is the critic pretending it worked. Counts live on Today. Ask Roofus tonight and he names tomorrow.",
  },
  {
    id: "f_seed_warranty",
    q: "What warranty may I say?",
    a: "Whatever Presets say. Default if Presets are blank: Owens Corning Duration. Preferred (when built and registered to spec: 4 OC components + OC underlayment + OC ridge) = TruPro 50 including tear-off/disposal, workmanship first 10 years. Always “see the actual OC warranty.” Never “lifetime labor,” never “50-year workmanship,” never guaranteed claim + full warranty.",
  },
  {
    id: "f_seed_record",
    q: "Can I record the homeowner?",
    a: "No. Practice in the truck with Roleplay. Two-party consent states: do not record without a clear yes. Never coach recording a customer.",
  },
];
