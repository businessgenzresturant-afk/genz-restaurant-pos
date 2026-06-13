# Petpooja Comprehensive Research Document

## Overview
Petpooja is an all‑in‑one restaurant management platform (SaaS) targeting Small and Medium Enterprises (SMEs) in the food‑service industry. It integrates POS, inventory, billing, payroll, CRM, and reporting into a single web‑based solution accessible via browser.

## Core Modules & Features
1. **POS (Point of Sale)**
   - Order management, table layout, split/merge bills, discounts
   - Mobile access for wait staff, kitchen display system (KDS)
   - Real‑time order status tracking
2. **KOT (Kitchen Order Ticket)**
   - Send orders to kitchen, track preparation status, timers
   - Supports multiple kitchen stations, display on screens/tablets
3. **Billing & Invoicing**
   - GST‑compliant invoices, bill printing, payment collection
   - Supports cash, card, UPI, wallet payments
4. **Inventory Management**
   - Stock tracking, auto‑deduction on sales, low‑stock alerts
   - Supplier management, purchase orders, GRN (Goods Received Note)
5. **Purchase & AI‑driven Invoice Processing**
   - AI extracts data from supplier invoices (image/pdf → structured data)
   - Generates insights for better procurement decisions
6. **CRM & Customer Management**
   - Customer database, loyalty points, SMS/WhatsApp marketing
   - Order history, preferences, feedback collection
7. **Tasks & Workflow Automation**
   - Create, assign, track staff tasks (opening/closing, cleaning, maintenance)
   - AI verification via photo/video comparison to task requirements
   - Geofencing: task only markable when staff physically in zone
   - 150+ industry‑specific templates
8. **Reports & Analytics**
   - 80+ built‑in reports: daily sales, profit & loss, tax, staff performance, menu popularity
   - Export to PDF/Excel, schedule email reports
9. **Integrations**
   - Payment gateways: Razorpay, Stripe, Paytm, UPI
   - Food aggregators: Swiggy, Zomato (order sync)
   - Accounting software: Tally, QuickBooks (via export/API)
   - ERP systems: ERPNext, SAP (custom connectors)
   - WhatsApp Business API for ordering & notifications
   - Google My Business, Facebook, Instagram for reviews & promotion

## Technology Stack (as of 2024‑2026)
| Layer | Technologies |
|-------|--------------|
| **Frontend** | React.js (primary), alternatives: Vue.js, React Native, Flutter |
| **Backend** | Node.js (primary), Python (Django/Flask), PHP (Laravel) |
| **Database** | MySQL, MongoDB, SQLite (primary); PostgreSQL as alternative |
| **Cloud / Infra** | AWS, Google Cloud, Azure, DigitalOcean, Firebase (optional) – OS‑independent deployment |
| **DevOps** | Docker containers, GitHub Actions CI/CD, Kubernetes (for scaling) |
| **Realtime** | WebSocket (Socket.IO) for live KOT/KDS updates; Supabase Realtime as alternative |
| **AI/ML** | TensorFlow/PyTorch models for invoice OCR, task verification; hosted on cloud GPU instances |
| **Other** | Redis (caching, rate limiting), Elasticsearch (search/logs), RabbitMQ/Kafka (event streaming) |

## Pricing Model (India, 2026)
- **Subscription Tiers (per outlet, per month)**
  - **Basic**: ₹3,000 – ₹5,000 → billing, basic KOT, table management
  - **Standard**: ₹5,000 – ₹8,000 → adds inventory, CRM, basic reports
  - **Premium**: ₹8,000 – ₹12,000 → adds multi‑location, loyalty, online ordering, advanced reports
  - **Enterprise**: Custom pricing → full suite, dedicated support, SLA
- **One‑time Fees**
  - Setup/Installation: ₹5,000 – ₹15,000
  - Hardware (thermal printer, cash drawer, display): ₹15,000 – ₹50,000+
- **Add‑ons**
  - SMS/WhatsApp packages: ₹500 – ₹2,000/month
  - Extra integrations (Swiggy/Zomato): variable

## Financial Snapshot (FY24)
- **Revenue**: ₹77.2 Cr+ (₹772 Million) – up 42.42% YoY
- **Funding Raised**: $21.90 Million+ across 5 rounds (latest Series C Sept 2025)
- **Latest Valuation**: ≈ $103 Million (Sept 2025) per CBInsights
- **Customer Base**: 10,000+ active restaurant outlets across India
- **Growth Drivers**: AI‑powered purchasing, task automation, expanding integrations

## Market Position & Competitors
- **Direct Competitors**: PosBytz, Posist, Limetray, Toast (US), Square for Restaurants
- **Differentiators**: All‑in‑one suite, AI modules, affordable pricing for SMEs, strong Indian market localization (GST, regional languages)
- **USP**: Single subscription replaces multiple disparate tools (POS separate, inventory separate, accounting separate)

## Development Effort Benchmarks (for similar SaaS POS)
| Scope | Estimated Effort (Solo Dev) | Rough Cost (INR) |
|-------|----------------------------|------------------|
| Core POS + KOT + Bill | 3‑4 weeks | ₹20,000 – ₹40,000 |
| + Inventory Management | +2‑3 weeks | +₹20,000 – ₹40,000 |
| + Basic CRM & Reports | +2‑3 weeks | +₹20,000 – ₹40,000 |
| + AI Invoice OCR + Task Verification | +3‑4 weeks | +₹30,000 – ₹60,000 |
| Full MVP (comparable to Petpooja Lite) | 8‑12 weeks | ₹90,000 – ₹1,80,000 |
| Production‑grade SaaS (multi‑tenant, scaling, CI/CD) | 4‑6 months | ₹3,00,000 – ₹6,00,000+ |

## Legal & Compliance
- GST‑ready invoicing (auto‑calculates CGST/SGST/IGST)
- Data‑privacy: configurable data retention, optional encryption at rest
- PCI‑DSS compliance for payment processing (via gateway providers)
- Optional audit logs for user actions

## Strengths
- Low entry cost (monthly OPEX vs high CAPEX)
- Rapid deployment (browser‑based,no installation)
- Continuous updates & new features included
- Strong support & training resources
- AI features reduce manual work (invoice processing, task verification)

## Weaknesses / Limitations
- Internet dependency (offline mode limited)
- Custom deep integrations may require paid add‑ons
- Vendor lock‑in (data export possible but migration effort)
- Advanced analytics may require higher tier

## Use Cases
- **Single outlet restaurant** → Basic/Standard tier sufficient
- **Multi‑outlet chain** → Premium/Enterprise for central dashboard
- **Cloud kitchens** → Focus on inventory + AI purchasing + OMS
- **Bakery / Ice‑cream** → Loyalty + CRM + seasonal promotions
- **Bar / Brewery** → Age verification, happy‑hour pricing, keg tracking

## References & Sources
1. Petpooja official website – features & pricing pages
2. DineOpen Blog 2026 – pricing tier breakdown
3. Inc42 Financials – revenue & funding data
4. CBInsights – valuation & funding rounds
5. TechStory & Afaqs articles – AI expansion & funding news
6. Blog.AbhayRay.com – technology stack breakdown
7. StackShare & Crunchbase (limited access) – tech stack hints
8. SaaSworthy, G2, SelectHub, Capterra – pricing & feature comparisons
9. Petpooja Tasks blog – AI verification, geofencing, templates
10. JungleWorks documentation – API & integration guides
11. Postman workspace – sample API requests
12. GitHub community SDKs (PHP, JS) – open‑source wrappers
13. Freelancer project listings – real‑world integration examples
14. CodingClave guide – custom POS development cost benchmark
15. Various review sites (SoftwareWorld, SelectHub) – feature validation
