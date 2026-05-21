# CampusCrate — Master Engineering & Product Prompt
**Version:** 2.0 | **Stack:** React · FastAPI · PostgreSQL · Python · TypeScript  
**Role Context:** Full-Stack Dev + AI Engineer + Product Manager + Marketing Head

---

## 0. TL;DR — What CampusCrate Must Become

CampusCrate v1 is a well-designed static prototype — dark theme, clean UI, localStorage state.  
CampusCrate v2 must become a **trust-first, AI-augmented student economy platform** with a real backend, real identity, real money flows, and real safety — while staying dead simple for a broke 19-year-old to use in 60 seconds.

---

## 1. HONEST AUDIT OF V1

### What's Working
- Visual polish: glassmorphism dark theme is on-brand for Gen Z
- Feature vocabulary is correct: rent / sell / donate / request board
- Social impact stats are a powerful hook — keep and make them real
- Trust score concept is the right moat — needs real data behind it

### Critical Gaps (Blockers for Real Launch)
| Gap | Risk |
|---|---|
| No real auth — localStorage only | Zero security, no identity |
| No backend — all data per-device | Zero network effects |
| No real chat — random bot replies | Users can't actually transact |
| No image storage | Listings are untrustworthy without photos |
| No moderation | One bad actor poisons the well |
| No payment layer | Monetization = zero |
| No mobile responsiveness audit | 80%+ of students are phone-first |

---

## 2. TECH STACK RECOMMENDATION

```
Frontend     →  React 18 + TypeScript + Vite
Styling      →  Tailwind CSS (keep your CSS variables as tokens)
State        →  Zustand (lightweight) + React Query (server state)
Backend      →  FastAPI (Python) — you already know this
Database     →  PostgreSQL (primary) + Redis (sessions/cache/pub-sub)
Auth         →  JWT (access) + Refresh Tokens + .edu email OTP
File Storage →  Cloudinary (free tier, image CDN, resize on-the-fly)
Real-time    →  FastAPI WebSockets → Redis pub/sub (chat)
Search       →  PostgreSQL full-text search → Typesense later
AI           →  Anthropic Claude API (claude-sonnet-4-20250514)
Payments     →  Razorpay (India-native, student UPI support)
Deployment   →  Railway / Render (FastAPI) + Vercel (React)
```

No blockchain needed yet. Solidity is a future layer for tokenized trust scores, not v2.

---

## 3. FULL FEATURE ROADMAP

### Phase 1 — Foundation (Weeks 1–4)

#### 3.1 Auth System

**Backend (FastAPI + PostgreSQL)**

```python
# Models needed
class User(Base):
    id: UUID
    email: str           # must be .edu or college-whitelisted domain
    name: str
    college: str
    city: str
    phone: str | None    # optional, for UPI later
    avatar_url: str | None
    is_verified: bool    # email OTP confirmed
    is_phone_verified: bool
    trust_score: float   # computed field
    created_at: datetime
    last_active: datetime

class EmailOTP(Base):
    email: str
    otp_hash: str        # bcrypt hash of 6-digit code
    expires_at: datetime
    attempts: int        # max 5
    is_used: bool
```

**Flow:**
1. User enters `.edu` or whitelisted college email → POST `/auth/request-otp`
2. Backend generates 6-digit OTP, hashes it (bcrypt), stores with 10-min TTL
3. Sends OTP via email (use **Resend.com** — free 3k emails/month, simple API)
4. User submits OTP → POST `/auth/verify-otp` → returns JWT access token (15min) + refresh token (30 days, httpOnly cookie)
5. Forgot password = same OTP flow, different endpoint

**College Email Whitelist Strategy:**
```python
ALLOWED_DOMAINS = [
    "*.edu",           # US pattern
    "*.ac.in",         # Indian colleges
    "*.edu.in",
    "iit*.ac.in",      # IIT
    "nit*.ac.in",      # NIT
]
# Also maintain a manual whitelist table for colleges using Gmail
```

**Frontend (React)**
```tsx
// Auth flow states
type AuthStep = 
  | 'email_input'      // Enter college email
  | 'otp_sent'         // OTP sent, show 6-box input
  | 'otp_verified'     // Success → redirect
  | 'profile_setup'    // First-time: name, college, city, year
  | 'forgot_password'  // Reuse OTP flow

// OTP input: 6 individual boxes, auto-focus next, paste support
// Countdown timer: resend after 60s
// Max 5 attempts before lockout (show "try again in 15 min")
```

**Security Rules:**
- Rate limit `/auth/request-otp` to 3 requests/hour per IP
- Rate limit `/auth/verify-otp` to 5 attempts per OTP
- Never return "email not found" — always "if this email exists, OTP was sent"
- Store only OTP hash, never plaintext
- Refresh token rotation on every use

---

#### 3.2 Forget Password

```
POST /auth/forgot-password
  → same OTP email flow
  → on verify: return a short-lived "reset token" (UUID, 15min TTL)
  
POST /auth/reset-password
  body: { reset_token, new_password }
  → hash password (bcrypt), invalidate all existing refresh tokens for user
```

For a student marketplace, password-based auth should be secondary. Push OTP-only login as the default ("No password to remember!").

---

#### 3.3 Privacy & Data

**Privacy Page must include:**
- What data you collect (email, college, city, listings, messages)
- What you DON'T collect (payment card data — Razorpay handles it)
- Data retention: listings deleted after 6 months of inactivity
- Right to deletion: account wipe endpoint `/users/me/delete`
- No data sold to third parties (student trust is fragile — say this loudly)
- GDPR-lite + IT Act 2000 compliance note for Indian users

**In-app privacy controls (Settings page):**
```
[ ] Show my college name on profile (default: ON)
[ ] Show my city on listings (default: ON)  
[ ] Allow other users to see my active listings (default: ON)
[ ] Receive marketing emails (default: OFF)
[Delete My Account] → requires OTP confirmation, 30-day grace period
```

---

### Phase 2 — Core Marketplace (Weeks 5–8)

#### 3.4 Listings Backend

```python
class Listing(Base):
    id: UUID
    seller_id: UUID (FK → User)
    title: str
    description: str
    category: Enum  # Books, Electronics, Lab Tools, Hostel, Stationery, Sports, Clothing, Other
    condition: Enum  # New, Like New, Good, Fair, Poor
    type: Enum  # sell, rent, donate
    price: Decimal | None  # null for donate
    rent_per: str | None   # "day" | "week" | "month"
    deposit: Decimal | None  # for rentals
    location: str
    images: list[str]  # Cloudinary URLs, max 5
    is_active: bool
    is_flagged: bool
    view_count: int
    created_at: datetime
    expires_at: datetime  # auto-expire after 60 days
```

**Image Upload Flow:**
```
Client → POST /listings/upload-image (multipart)
  → FastAPI resizes to max 1200px (Pillow)
  → Uploads to Cloudinary
  → Returns { url, thumbnail_url }
  → Client stores URLs, submits listing
```

**Search & Filter (PostgreSQL full-text):**
```sql
CREATE INDEX listings_search_idx ON listings 
USING gin(to_tsvector('english', title || ' ' || description));

-- Query
SELECT * FROM listings 
WHERE to_tsvector('english', title || ' ' || description) @@ plainto_tsquery('english', $1)
AND city = $2 AND category = $3 AND is_active = true
ORDER BY created_at DESC;
```

---

#### 3.5 Real-Time Chat (WebSockets)

This is the most critical UX feature. The current random-reply bot will lose every user.

**Architecture:**
```
React Client ←→ FastAPI WebSocket ←→ Redis Pub/Sub ←→ FastAPI WebSocket ←→ React Client
```

**Backend:**
```python
# WebSocket endpoint
@app.websocket("/ws/chat/{room_id}")
async def chat_ws(websocket: WebSocket, room_id: str, user: User = Depends(get_ws_user)):
    await manager.connect(websocket, room_id, user.id)
    try:
        while True:
            data = await websocket.receive_json()
            msg = await save_message(room_id, user.id, data["text"])
            await manager.broadcast(room_id, msg)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)

class Message(Base):
    id: UUID
    room_id: UUID        # derived from sorted(buyer_id, seller_id) + listing_id
    sender_id: UUID
    text: str
    is_read: bool
    created_at: datetime
```

**Chat Room Creation:**
- Room ID = deterministic: `sha256(sorted([buyer_id, seller_id]) + listing_id)`
- Created lazily on first message
- Max message length: 1000 chars (prevent spam)
- No file sharing in chat v1 (security risk)

**Frontend Chat UI:**
```tsx
// Unread badge on nav icon
// Chat list: show all conversations, last message preview, unread count
// Message bubbles: sent (right, purple), received (left, surface)
// Read receipts: single tick = delivered, double tick = read
// "Is typing..." indicator via WS event
// Block/Report user button in chat header
```

**Safety in Chat:**
- Phone numbers, UPI IDs, external links → filter with regex, show warning toast
- "Share contact" feature only unlocks after both parties agree (mutual tap)
- All messages logged server-side for moderation (disclosed in privacy policy)

---

#### 3.6 Contact & Meetup Safety

**Instead of sharing phone numbers in chat:**
```
[Agree to Meet] button
  → Both users confirm time + campus location
  → App generates a "Meetup Card" with:
      - Item name
      - Agreed price
      - Location (college campus landmark)
      - Time
      - Both user names + trust scores
  → Shareable as screenshot / PDF
```

This is a significant differentiator from WhatsApp groups. It keeps transactions on-platform.

---

### Phase 3 — Monetization (Weeks 9–12)

#### 3.7 Buy/Sell Fee Model

**Recommended: Freemium + Small Commission**

```
Free Tier (default for all students):
  - 5 active listings at a time
  - Standard search placement
  - Basic chat

CampusCrate Plus (₹49/month or ₹399/year):
  - Unlimited listings
  - Priority search placement ("Featured" badge)
  - Verified badge on profile
  - Listing analytics (views, saves, chat requests)

Transaction Fee (for sell listings only):
  - 2% of sale price, capped at ₹50
  - Paid by seller on successful transaction
  - "Mark as Sold" flow triggers fee
  - Rent listings: ₹10 flat fee per successful rental
  - Donate listings: always FREE (social good signal)
```

**Why 2% capped at ₹50:**
- A ₹500 book sale = ₹10 fee. Student will pay this.
- A ₹5000 laptop sale = ₹50 fee. Still worth it vs ₹0 on OLX with safety risk.
- Psychologically: "less than a chai at the canteen"

**Razorpay Integration:**
```python
# On "Mark as Sold" confirmation:
POST /transactions/initiate
  → Create Razorpay Order for 2% of agreed_price
  → Seller pays via UPI / card
  → On webhook confirmation → mark listing sold, release funds

# Razorpay webhooks → FastAPI endpoint with signature verification
```

**Future:** Escrow model — buyer pays platform, platform releases to seller after 48h confirmation window. Requires RBI compliance (Payment Aggregator license). Defer to post-PMF.

---

### Phase 4 — AI Layer (Weeks 13–16)

#### 3.8 AI Features (Claude API)

**Feature 1: Smart Listing Assistant**
```
User fills in title → AI auto-suggests:
  - Category
  - Condition estimate based on description
  - Recommended price (based on similar listings in DB)
  - Description improvements ("Your description is 12 words. Add condition, age, and reason for selling to get 3x more responses.")

Prompt:
"You are a marketplace listing assistant for Indian college students. 
Given this item title: '{title}' and description: '{desc}', 
return JSON: { category, suggested_price_inr, condition_hints, description_tip }
Base price on Indian student market rates."
```

**Feature 2: Scam / Duplicate Detector**
```python
# On new listing submit:
async def check_listing_safety(listing: ListingCreate, similar: list[Listing]):
    prompt = f"""
    New listing: {listing.title} | ₹{listing.price} | {listing.description}
    Similar recent listings: {[l.title + ' ₹' + str(l.price) for l in similar[:5]]}
    
    Flag if: price is >3x market rate, description is copied, 
    or item seems counterfeit. Return JSON:
    {{ "risk_level": "low|medium|high", "reason": str, "action": "approve|warn|hold" }}
    """
    # claude-sonnet-4-20250514 call
```

**Feature 3: AI Chatbot (Future Upgrade — Phase 5)**
```
NOT a replacement for buyer-seller chat.
A platform assistant bot accessible via "Help" button:

- "What's a fair price for a 2nd year CBSE Physics textbook?"
- "How do I safely meet a stranger for a campus exchange?"  
- "My item has been listed for 2 weeks with no views. What should I change?"
- "I think this listing is suspicious. What should I do?"

System prompt:
"You are CampusCrate Assistant, helping Indian college students 
safely buy, sell, rent, and donate campus items. You know:
- Indian college culture and student budgets (₹100–₹10,000 range)
- Safety best practices for in-person exchanges
- How to write good listings
- Platform policies
Never give financial advice. Always recommend meeting on campus. 
Never share external contact details."
```

**Feature 4: Personalized Feed (ML-lite)**
```python
# Simple collaborative filtering to start (no neural net needed)
# "Students in your college who viewed X also saved Y"
# Implemented as PostgreSQL query + Redis cache, not a full ML pipeline

# Re-rank feed by:
# 1. Same college first
# 2. Category match with user's past views
# 3. Listing freshness (last 7 days weighted 2x)
# 4. Seller trust score
```

---

### Phase 5 — Trust & Safety (Ongoing)

#### 3.9 Trust Score System (Real Implementation)

```python
def compute_trust_score(user: User, db: Session) -> float:
    score = 0.0
    
    # Base: email verified (required)
    score += 20
    
    # Phone verified (+10)
    if user.is_phone_verified: score += 10
    
    # Listing history (+1 per listing, max 15)
    listings = get_listings_count(user.id, db)
    score += min(listings, 15)
    
    # Ratings received (avg * 10, max 30)
    avg_rating = get_avg_rating(user.id, db)
    if avg_rating: score += avg_rating * 6  # 5★ = 30 pts
    
    # Successful transactions (+3 each, max 15)
    transactions = get_completed_transactions(user.id, db)
    score += min(transactions * 3, 15)
    
    # Account age (+1 per month, max 10)
    months = (datetime.now() - user.created_at).days // 30
    score += min(months, 10)
    
    # Penalties
    if user.reports_received > 3: score -= 20
    if user.has_dispute_history: score -= 10
    
    return max(0, min(100, score))
```

**Display trust tiers visibly:**
```
0–30:   🔴 New (unverified feel)
31–55:  🟡 Regular
56–75:  🟢 Trusted  
76–90:  💎 Campus Star
91–100: ⭐ CampusCrate Verified Pro
```

#### 3.10 Reporting & Moderation

```
Report Listing:  Fake item | Wrong price | Already sold | Inappropriate
Report User:     Scam attempt | Harassment in chat | No-show at meetup

Moderation Queue (Admin Dashboard):
  - Auto-hold listings with AI risk_level: "high"
  - 3 reports on same listing → auto-hide, human review within 24h
  - 3 reports on same user → temporary suspension, email sent
  - Admin panel: FastAPI + simple React table, no fancy CMS needed
```

---

## 4. DATABASE SCHEMA (PostgreSQL)

```sql
-- Core tables (simplified)
users, listings, listing_images, categories,
chat_rooms, messages, 
transactions, ratings, reviews,
reports, otp_logs, refresh_tokens,
notification_preferences, saved_listings,
item_requests, trust_score_log

-- Key indexes
CREATE INDEX idx_listings_city_cat ON listings(city, category) WHERE is_active = true;
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_messages_room ON messages(room_id, created_at DESC);
CREATE INDEX idx_users_email ON users(email);
```

---

## 5. API DESIGN (FastAPI)

```
Auth
  POST   /auth/request-otp
  POST   /auth/verify-otp
  POST   /auth/refresh
  POST   /auth/logout
  POST   /auth/forgot-password
  POST   /auth/reset-password

Users
  GET    /users/me
  PATCH  /users/me
  DELETE /users/me
  GET    /users/{id}/profile (public)

Listings
  GET    /listings?city=&category=&type=&q=&page=
  POST   /listings
  GET    /listings/{id}
  PATCH  /listings/{id}
  DELETE /listings/{id}
  POST   /listings/{id}/save
  POST   /listings/{id}/report
  POST   /listings/upload-image

Chat
  GET    /chat/rooms (my conversations)
  GET    /chat/rooms/{room_id}/messages
  WS     /ws/chat/{room_id}

Requests (Item Wanted Board)
  GET    /requests
  POST   /requests
  DELETE /requests/{id}

Transactions
  POST   /transactions/initiate
  POST   /transactions/webhook (Razorpay)
  GET    /transactions/my

Ratings
  POST   /ratings/{transaction_id}
  GET    /ratings/user/{user_id}

Admin
  GET    /admin/reports
  POST   /admin/reports/{id}/resolve
  GET    /admin/listings/flagged
  GET    /admin/stats
```

---

## 6. FRONTEND ARCHITECTURE (React + TypeScript)

```
src/
├── components/
│   ├── ui/           # Button, Input, Badge, Modal, Toast, Avatar
│   ├── auth/         # OTPInput, EmailForm, ProfileSetup
│   ├── listing/      # ListingCard, ListingDetail, ListingForm, ImageUpload
│   ├── chat/         # ChatList, ChatRoom, MessageBubble, TypingIndicator
│   ├── profile/      # ProfileHeader, TrustBadge, ListingsGrid
│   └── layout/       # Navbar, Footer, Sidebar
├── pages/
│   ├── Landing.tsx
│   ├── Marketplace.tsx
│   ├── ListingDetail.tsx
│   ├── AddListing.tsx
│   ├── Profile.tsx
│   ├── Chat.tsx
│   ├── Requests.tsx
│   ├── Settings.tsx
│   └── Admin.tsx
├── hooks/
│   ├── useAuth.ts
│   ├── useListings.ts
│   ├── useChat.ts
│   └── useWebSocket.ts
├── stores/
│   ├── authStore.ts  (Zustand)
│   └── chatStore.ts
├── api/
│   ├── client.ts     (Axios instance + interceptors)
│   ├── auth.ts
│   ├── listings.ts
│   └── chat.ts
└── utils/
    ├── trustScore.ts
    ├── priceFormat.ts
    └── validators.ts
```

---

## 7. WHAT ACTUALLY MAKES THIS STAND OUT

### 7.1 The "College Email Wall" as a Feature, Not a Barrier
Market it as: **"The marketplace where everyone is a real student."**  
OLX and Facebook Marketplace are anonymous. You're verified-only. That's your moat.  
Tagline: *"Trade with your own kind."*

### 7.2 Sustainability Score on Every Listing
```
Every completed exchange shows:
  🌱 Carbon saved: ~X kg CO₂ (books = 2.5kg, electronics = 15kg)
  💰 Student community saved: ₹X total this month
  ♻️ X items rescued from landfill this year
```
Make this shareable. Students post on Instagram. Free growth loop.

### 7.3 "Borrow Board" (Unique to Campus)
Add a separate tab for short-term borrows (1–3 days, free):
- "Need a stapler for 2 hours before the submission deadline"
- "Borrowing a formal shirt for an interview tomorrow"
This is hyper-local, hyper-useful, and WhatsApp can't do it well.

### 7.4 Semester Cycles = Built-in Viral Growth
At the start of every semester → bulk listing event ("Freshers, sell what you don't need!")  
At the end of every semester → exodus listings ("Leaving hostel, everything must go!")  
Build in-app notifications + email campaigns around these moments.

### 7.5 Institute Partnerships (B2B2C Growth)
Pitch college student councils to be "official campus partners."  
Give them a dashboard showing sustainability impact stats.  
They promote it, you get an institutional trust signal.

---

## 8. MARKETING STRATEGY

### Acquisition
- **Reddit:** r/india, r/beingindia, r/iit — post honest "I built this for students" story
- **Instagram Reels:** "POV: You're selling your 3rd year textbooks for ₹50 instead of ₹0"  
- **College WhatsApp groups:** Seed listings manually in 5 colleges, create FOMO
- **YouTube Shorts:** "How I saved ₹8,000 as a hostel student using CampusCrate"

### Retention
- Weekly "Near You" email digest of new listings in the user's city
- "Your listing has 14 views this week" notifications — dopamine loop
- Leaderboard: "Top Eco Warriors at [College Name] this semester"

### Virality
- Referral: "Invite a college friend → both get 3 months of Plus free"
- Listing share card: beautiful OG image with item + price + campus (auto-generated via Canvas API or a server-side template)

---

## 9. MASTER AI PROMPT — CLAUDE INTEGRATION

Use this as the system prompt for all Claude API calls in CampusCrate:

```
You are CampusCrate AI, a helpful assistant embedded in a student-only marketplace for Indian college students. Your role is to help students list items accurately, price fairly, stay safe, and trust each other.

CONTEXT:
- Users are verified college students in India (age 17–25)
- Items traded: textbooks, electronics, lab tools, hostel supplies, stationery, sports gear, clothing
- Transaction types: sell, rent (with deposit), donate (free)
- Price range: typically ₹50 to ₹15,000
- Platform values: safety, sustainability, student savings

WHAT YOU CAN DO:
- Suggest fair prices based on item type, condition, and age
- Improve listing titles and descriptions for more responses
- Detect suspicious listings or pricing (flag, don't accuse)
- Answer platform how-to questions
- Give campus exchange safety tips
- Help students write polite negotiation messages

WHAT YOU MUST NOT DO:
- Never give financial, legal, or medical advice
- Never share or ask for personal contact details
- Never facilitate transactions outside the platform
- Never discuss unrelated topics (politics, adult content, etc.)
- Never claim certainty about prices — always say "typically" or "in my experience"

TONE:
- Friendly, like a smart college senior, not a corporate bot
- Use light Indian English ("hey!", "sure!", "₹" not "$")
- Keep responses under 150 words unless explaining a complex topic
- Use bullet points for lists, plain sentences for conversational replies

SAFETY ESCALATION:
If a user describes feeling unsafe, threatened, or harassed → 
immediately say: "That sounds serious. Please use the Report button on the listing/profile, 
and if you feel physically unsafe, contact your campus security or call 112."
```

---

## 10. SECURITY CHECKLIST

```
Auth
  ✅ OTP hashed (bcrypt), never stored plaintext
  ✅ JWT access token 15min TTL
  ✅ Refresh token rotation + httpOnly cookie
  ✅ Rate limiting on all auth endpoints (slowapi)
  ✅ Email enumeration prevention

API
  ✅ CORS restricted to your frontend domain only
  ✅ All endpoints require auth except GET /listings, GET /listings/{id}
  ✅ Input validation via Pydantic (FastAPI default)
  ✅ SQL injection impossible via SQLAlchemy ORM
  ✅ File upload: whitelist image types, max 5MB, virus scan (ClamAV or VirusTotal API)
  ✅ Razorpay webhook signature verification

Data
  ✅ Passwords bcrypt-hashed (min cost 12)
  ✅ PII fields (phone) encrypted at rest (Fernet)
  ✅ Soft delete everywhere (never hard delete immediately)
  ✅ Admin routes require separate admin JWT claim

Frontend
  ✅ No sensitive data in localStorage (use memory + httpOnly cookie for auth)
  ✅ CSP headers
  ✅ XSS prevention via React's default escaping
  ✅ No API keys in frontend code
```

---

## 11. DEPLOYMENT ARCHITECTURE

```
                          [Cloudflare CDN]
                               │
              ┌────────────────┼────────────────┐
              │                │                │
         [Vercel]         [Railway]       [Cloudinary]
       React Frontend     FastAPI API     Image Storage
                               │
                    ┌──────────┼──────────┐
                    │          │          │
              [PostgreSQL]  [Redis]   [Resend.com]
               (Neon.tech)  (Upstash)  Email OTP
```

**Cost at launch (nearly ₹0):**
- Vercel: Free
- Railway: $5/month (FastAPI + PostgreSQL start)
- Neon.tech: Free tier PostgreSQL (10GB)
- Upstash Redis: Free tier (10k commands/day)
- Cloudinary: Free (25GB storage, 25GB bandwidth)
- Resend: Free (3,000 emails/month)

---

## 12. IMMEDIATE NEXT 3 STEPS

1. **Week 1:** Set up FastAPI project skeleton with auth (OTP email flow). Get one real user login working end-to-end. Nothing else matters until this is done.

2. **Week 2–3:** Port existing localStorage listings to PostgreSQL. Deploy to Railway. Update React frontend to call the real API.

3. **Week 4:** Implement real WebSocket chat. Remove the bot. This is your retention mechanism.

Everything else — AI, payments, analytics — comes after real users are talking to each other on real listings.

---

## 13. WHAT NOT TO BUILD (YET)

| Tempting Feature | Why to Wait |
|---|---|
| Blockchain/Solidity trust scores | Zero students care. Build trust score in PostgreSQL first. |
| Mobile app (React Native) | PWA first. Validate demand, then app. |
| AI price prediction ML model | Use Claude API for 6 months. Train a model when you have 10k transactions. |
| Escrow payments | Requires RBI Payment Aggregator license. Do Razorpay simple flow first. |
| Multi-city algorithm | Nail one city first. NIT Silchar → Siliguri → expand. |
| Admin ML dashboard | Basic admin panel is enough until 1k users. |

---

*This document is your source of truth. When in doubt: ship the trust layer first, the AI layer second, and the revenue layer third. Students don't pay for features — they pay for safety and savings.*

---
**CampusCrate v2.0** | Generated by CampusCrate Product Team | May 2026
