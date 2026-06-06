# Tide — Design Document

*A pocket companion for the moment the urge hits.*

**Tagline:** Cravings come in like waves. Tide helps you ride them out.

---

## 1. The core idea

Most habit apps are *trackers*. You log what you did, after you did it, and stare at streaks. That helps a little, but it does nothing in the one moment that actually decides the outcome: the 5–15 minutes when a craving peaks and you're standing at the fridge, the bar, or the corner shop.

Tide is built backwards from that moment. It is the thing you **reach for when you feel the urge** — a single button that opens a calm, guided session designed to get you to the other side of the wave. Tracking, insights, and streaks all exist, but they are secondary; they're fed automatically by the moments you ride out, so logging never feels like a chore.

The whole product is organized around one promise: *when you don't trust yourself, open this and it will hold your hand for ten minutes.*

### Why this works (the science)

The design leans on three well-established behavioral techniques, so the app isn't just vibes:

- **Urge surfing** (from Marlatt's relapse-prevention work). Cravings are not flat — they rise, crest, and fall, usually within 3–15 minutes, *whether or not you give in*. Most people don't know this. If you can observe the urge like a wave instead of fighting it, it passes on its own. Tide visualizes this literally.
- **The 4 Ds** (Delay, Distract, Deep-breathe, Drink water) — the standard quit-smoking/drinking toolkit. These become the in-session "quick actions."
- **CBT habit loop** (cue → craving → routine → reward). By logging trigger, location, and emotion at the moment of the urge, Tide surfaces *your* personal cues and helps you pre-plan replacement routines.

---

## 2. Who it's for

A person trying to cut down or quit one or more of: **overeating / junk food, alcohol, and smoking or vaping**. They've usually tried willpower alone and found that the hard part isn't *wanting* to change — it's the specific moment of temptation. They want something private, non-judgmental, and instantly available.

Tide treats all three habits with the same underlying engine because the *moment* is structurally identical across them — only the triggers, the replacement actions, and the "reasons" differ.

---

## 3. Design principles

1. **One thumb, ten seconds, zero shame.** When someone is mid-craving they have no patience and low self-control. The urge button is reachable on the very first screen with no login wall in the way. Nothing in the app ever scolds.
2. **Slips are data, not failure.** "I gave in" is a logged outcome that feeds insights, framed neutrally. Shame causes the *abstinence violation effect* — one slip spiraling into a binge — which is exactly what we want to prevent.
3. **The calm is the product.** Visuals, motion, and copy are deliberately slow and soft — a counterweight to the agitation of a craving. Deep blues and teals, breathing animations, gentle haptics.
4. **Earned, not nagged.** Encouragement and reminders show up around *known* high-risk windows (learned from the user's own data), not as generic daily pings.

---

## 4. The signature flow — "Ride the wave"

This is the heart of the app. Tapping the big button on the home screen starts a session:

**Step 1 — Name it (5 sec).** "What are you feeling pulled toward?" → Food / Drink / Smoke. Then an intensity slider, 1–10. That's the entire ask up front. (Everything else can be skipped.)

**Step 2 — Breathe + surf (the wave).** A full-screen wave animation rises and falls in time with a breathing pacer (4-second inhale, 6-second exhale). A soft timer counts the craving down — copy reassures: *"This feeling will peak and pass. You don't have to do anything but watch it."* The wave on screen literally crests and recedes, mirroring what the craving is doing in their body. Around the 3-minute mark it visibly subsides.

**Step 3 — Do something (optional, anytime).** A tray of quick actions tuned to the habit: *Drink a glass of water · 60-second walk · Text my anchor person · Quick game · Brush teeth · Chew gum.* These are the 4 Ds made tappable.

**Step 4 — Remember why.** One swipe reveals the user's personal "anchor": their own words about why they're doing this, a photo of someone/something that matters, money-saved-so-far, and a note from their past self written on a strong day.

**Step 5 — Close the loop (5 sec).** "How did that go?" → *Rode it out* / *Gave in a little* / *Gave in.* Re-rate intensity. Both supportive either way: riding it out celebrates; giving in says *"Thanks for being honest — that's still useful. Want to note what set it off?"* This auto-logs trigger, time, location, emotion for insights.

---

## 5. Feature set

### Home
The urge button dominates the screen — always one tap away. Below it: today's quietly-presented progress (waves ridden, current calm streak, money saved) and a "plan ahead" shortcut for known risky moments.

### Insights (the payoff for honest logging)
Patterns the user can't see themselves:
- **When** urges hit (heatmap by hour/day) — e.g. "Most of your urges land between 9–11pm."
- **What triggers them** (stress, boredom, social, after meals, specific places).
- **What actually helped** — which quick actions correlated with riding it out.
- **Win rate over time** — % of urges ridden out, trending up.
- **Tangible wins** — cigarettes not smoked, drinks skipped, money saved, calories avoided.

### Anchor (your reasons)
A personal vault: your stated reasons, photos, a letter from your past self, and a list of your accountability people. Surfaced inside the urge flow and editable anytime you feel strong.

### Trigger plans
For each habit, a short "if-then" plan built from the user's own data: *"If I get the after-dinner urge to smoke → I go brush my teeth and start a podcast."* Implementation-intention research shows these pre-commitments dramatically beat in-the-moment decisions.

### Gentle accountability (optional)
Designate one or two "anchor people." One tap inside a session texts them a pre-written *"having a tough moment"* message. No public feeds, no social pressure — just a lifeline if wanted.

### Smart, sparse notifications
Instead of a 9am daily nag, Tide learns the user's risky windows and sends one well-timed check-in: *"Evenings are usually tough — want to set up for tonight?"*

---

## 6. Multi-habit handling

A user picks which habits they're working on during a 60-second onboarding. Each habit carries its own: trigger list, replacement actions, reasons, and savings math (price per pack / per drink / per takeaway). The urge flow is one engine; it just loads the right habit's content. Someone working all three sees a combined home screen but per-habit insights.

---

## 7. Tone & voice

Warm, plain, and brief. Never clinical, never cheerful-to-the-point-of-annoying, never shaming.

- Good: *"You're here. That's the hard part. Let's ride this out together."*
- Good (after a slip): *"Okay. That happened. It doesn't erase anything. What set it off?"*
- Avoid: *"You failed your streak!"* / *"Don't give up!!!"* / anything with guilt.

---

## 8. What's deliberately *not* in v1

Calorie databases, barcode scanners, AA-style meeting finders, gamified avatars, and big social networks are all out of scope for the first version. They pull focus from the one thing Tide does better than anything else: getting a person through a single craving. Those can come later as integrations.

---

## 9. Visual system (summary)

- **Palette:** deep ocean navy `#0B1F3A` → teal `#2DD4BF`, with warm sand `#F5E6CA` accents for "reasons/anchor" moments.
- **Type:** a soft humanist sans (e.g. Inter / SF Rounded). Large, low-density screens.
- **Motion:** everything eases slowly (600–800ms). The wave is the brand.
- **Haptics:** gentle pulse on the breathing pacer; a soft success buzz when a wave is ridden out.

---

*See the accompanying interactive prototype (`Tide_Prototype.html`) to click through the home screen, the full "ride the wave" session, insights, and the anchor screen.*
