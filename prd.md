Product Requirements Document (PRD)

Project Name: Sabi (Free-to-Play Football Prediction App)
Platform: Mobile-First Web Application
Tech Stack: TanStack Fullstack (TanStack Router, TanStack Query, React, backend/API layer via TanStack Start or similar SSR framework, Tailwind CSS)

1. Executive Summary

Sabi is a 100% free-to-play, zero-stake football prediction platform. Users compete in weekly ranked leaderboards by calling match winners. Unlike traditional betting, users deposit nothing. The weekly prize pot is funded entirely by a self-serve, native advertising model ("Lagos Life" style), where brands purchase visible ad inventory directly on the platform. The top players win cash (Naira) and airtime/data weekly.

2. Core Gameplay Mechanics

2.1 Predictions & Fixtures

Action: Users pick the outright winner (or draw) of real-world football matches.

Locking: Picks lock exactly at the scheduled kickoff time. No edits are allowed post-kickoff.

Frequency: Fixtures can happen on any day of the week, but all points aggregate into a single weekly contest.

2.2 Scoring System

Correct Pick (Favorite/Home): +10 points

Correct Pick (Underdog/Away): +15 points

Wrong Pick: −5 points

Skip/No Pick: 0 points

2.3 Leaderboards

Weekly Board (The Payout Board): Resets every Monday at 00:00. All points earned from Monday to Sunday count here. This is the only board that pays prizes.

Season Board (The Prestige Board): Accumulates points over the entire football season. Ranks players for bragging rights only; no financial payout.

2.4 Prize Structure & Distribution

Weekly Pot: A single, capped prize pool (e.g., ₦20,000) announced at the start of the week.

1st Place: Receives a Naira share of the pot (Status shown as "Pending Verification / Delayed Payout" until bank details are collected).

2nd to 10th Place: Receives Airtime or Data credited directly to their registered phone number.

11th Place and Below: Rank only, no prize.

3. User Authentication & Data

Onboarding: Login via Phone Number only (OTP). No passwords, no lengthy signup forms.

Progressive Profiling: Bank or mobile wallet details are only requested if a user finishes in 1st place (cash-paying rank).

4. Monetization Strategy: "Lagos Life" Ad Inventory

The platform operates a self-serve advertising model. Ads are native, highly visible, and integrated seamlessly into the UI to feel like digital billboards.

4.1 Ad Placements

Fixture Banner: One horizontal slot placed above or beside the match list.

Leaderboard Takeover: A premium slot fixed at the very top of the Weekly Board.

Sidebar / Card Slots: 3–4 smaller modular placements interspersed between matches or located on the user Profile screen.

Featured Spot: A large, high-visibility placement on the primary home screen.

Requirement: Every placement must display a logo, short text, a hyperlink, and a clear "Ad" badge.

4.2 Advertiser Flow (Self-Serve)

A dedicated "Advertise" button/page accessible to all users.

Brands can view available slots and weekly prices (e.g., ₦5,000–₦50,000).

Brands can upload a logo, input text, paste a link, and immediately see a live preview of their ad in the chosen slot.

5. Screen Map & User Flow

1. Fixtures Screen (Home)

Top Bar: User’s current weekly points, current weekly rank.

Header: "Free to Play - No Deposit Required".

Content: Chronological list of upcoming matches with kickoff times and "Pick Winner" buttons.

Ads: Featured Spot ad and Fixture Banner ad visible.

2. Weekly Leaderboard

Header: Total Weekly Pot (e.g., "This Week's Pot: ₦20,000").

Ads: Leaderboard Takeover ad at the top.

Content: Ranked list of players. Ranks 1-10 have distinct UI badges (Gold for cash, Silver/Bronze for airtime).

Footer/Nav: Link to view the Season Board.

3. Season Leaderboard

Content: Ranked list showing total accumulated points. Clear messaging that this board is for rank/prestige only.

4. Profile Screen

Content: Masked phone number, Weekly Points, Weekly Rank, Season Rank.

History: List of past picks and their scoring outcomes (+10, -5, etc.).

Ads: Sidebar/Card ad slot visible at the bottom.

5. Monday Results View

Trigger: Shows on the first login of the new week.

Content: A summary of last week's top places and exactly what they received (e.g., "1st: 0803*** won ₦10,000", "2nd: 0812*** won ₦1,000 Airtime").

6. Ad Board / Advertise Screen

Content: Catalog of available ad placements with mock weekly prices.

Interactive Form: "Publish a Mock Ad" flow (upload logo, add text/link, select slot).

Confirmation: Shows the ad going "live" into the prototype.

6. Technical Architecture (TanStack Fullstack)

Routing: TanStack Router for fully type-safe, client-side routing (essential for smooth transitions between fixtures and leaderboards).

Data Fetching: TanStack Query to handle server state, caching match data, and optimistic UI updates when a user makes a pick.

Framework: TanStack Start (or a Vite + React + Node/Hono backend) for server-side rendering, API routes, and backend logic.

Styling: Tailwind CSS for a mobile-first, clean, dark-mode compatible UI.

Database (Conceptual): PostgreSQL with Prisma or Drizzle ORM to manage Users, Matches, Picks, Leaderboards, and AdCampaigns.

7. Prototype Data Requirements

To demonstrate the flow without real APIs:

Fixtures: Hard-code 3–4 upcoming English Premier League (EPL) matches.

Users & Leaderboards: Seed the database/state with 15-20 dummy users with varied scores so the Weekly and Season boards are fully populated.

Ads: Hard-code 2–3 sample ads (e.g., a mock Fintech app, a mock beverage brand) into the exact slots to make the inventory look active and real.

Prizes: Do not integrate real payment gateways (Paystack/Flutterwave) or Telco APIs yet. Mock the payout state and airtime success screens.

8. Design & UX Guidelines

Mobile-First: 100% optimized for mobile viewports. Large tap targets for the "Pick" buttons to prevent fat-finger errors.

Trust Signals: "Free to Play", "No Deposit", and the Weekly Prize Pot must be the most prominent elements on the first screen.

Ad Integration: Ads should feel like native components (cards, dividers), not intrusive pop-ups. They should share the design system's border radii, typography, and spacing.

Theme: Implement a deep, rich Dark Mode (e.g., slate or pitch black with neon green/yellow accents for football vibes) to make team logos and ad banners pop.