# 🍽️ GenZ Restaurant POS System

A modern, full-stack Point of Sale (POS) system built for restaurants with Next.js 14, Prisma, PostgreSQL, and Supabase.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/raghavshahhh/genz-restaurant-pos)

## ✨ Features

### 🏠 Complete Restaurant Management
- **Dashboard** - Real-time statistics and quick actions
- **Tables** - Manage table status (Available/Occupied/Reserved)
- **Menu** - 179+ items with full CRUD operations
- **Orders** - Place orders with validation and special instructions
- **KOT** - Kitchen Order Tickets with auto-refresh and timers
- **Bills** - Generate bills with multiple payment methods
- **Reports** - Sales analytics and top-selling items
- **Settings** - Restaurant configuration and preferences

### 🔐 Authentication & Security
- NextAuth.js integration
- Role-based access (Admin/Staff)
- Password hashing with bcrypt
- Protected API routes
- Input validation and sanitization

### 💳 Payment Processing
- Cash payments
- Card payments
- UPI payments with QR code
- Bill generation and tracking
- Tax calculation (18% GST)

### 🎨 Modern UI/UX
- Responsive design (mobile, tablet, desktop)
- Animated transitions (Framer Motion, GSAP)
- Toast notifications
- Loading skeletons
- Print-friendly receipts
- Dark mode ready

## 🚀 Tech Stack

- **Frontend:** Next.js 14 (App Router), React 18, TypeScript
- **Backend:** Next.js API Routes, Prisma ORM
- **Database:** PostgreSQL (Supabase)
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS, Radix UI
- **State:** React Query
- **Forms:** React Hook Form + Zod validation
- **Deployment:** Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Supabase account)
- Git

## 🛠️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/raghavshahhh/genz-restaurant-pos.git
cd genz-restaurant-pos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/restaurant_pos"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
```

### 4. Set up database
```bash
# Push schema to database
npm run db:push

# Seed database with menu items and test data
npm run db:seed
```

### 5. Run development server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 🔑 Default Credentials (Development Only)

> ⚠️ **SECURITY WARNING**: These credentials are for local development only. Never use these in production!

After running `npm run db:seed`, you can login with:
- **Admin Account:**
  - Email: `admin@genz.com`  
  - Password: `admin123`

- **Staff Account:**
  - Email: `staff@genz.com`  
  - Password: `staff123`

**For Production:** Create new accounts with strong passwords after deployment and delete/disable these demo accounts.

## 📦 Project Structure

```
genz-restaurant-pos/
├── src/
│   ├── app/
│   │   ├── (auth)/          # Login, Register
│   │   ├── (pos)/           # POS pages (tables, menu, orders, etc.)
│   │   ├── api/             # API routes
│   │   └── page.tsx         # Dashboard
│   ├── components/          # Reusable components
│   ├── lib/                 # Utilities and configurations
│   └── types/               # TypeScript types
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script (179 menu items)
├── public/                  # Static assets
└── ...config files
```

## 🗄️ Database Schema

- **Restaurant** - Restaurant information
- **User** - Staff and admin accounts
- **Table** - Restaurant tables with status
- **MenuItem** - Menu items with categories
- **Order** - Customer orders
- **OrderItem** - Individual items in orders
- **Bill** - Generated bills with payment info

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with data
```

## 🌐 Deployment

### Deploy to Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `DIRECT_URL` (from Supabase)
   - `NEXTAUTH_URL` (your Vercel URL)
   - `NEXTAUTH_SECRET` (generate with `openssl rand -base64 32`)
4. Deploy!

**Detailed guide:** See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

### Quick Deploy Script
```bash
./deploy.sh
```

## 📱 Screenshots

### Dashboard
Real-time stats with quick actions to all modules.

### Orders
Step-by-step order placement with table selection and menu browsing.

### KOT (Kitchen)
Live kitchen display with timers and status updates.

### Bills
Generate bills, accept payments, and print receipts.

## 🧪 Testing Workflow

1. **Login** with admin credentials
2. **View Dashboard** - Check stats
3. **Tables** - Verify table status
4. **Menu** - Browse 179 items
5. **Orders** - Place test order
6. **KOT** - View in kitchen
7. **Update Status** - Preparing → Ready → Served
8. **Bills** - Generate and pay bill
9. **Reports** - Check sales data

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Raghav Shah**
- GitHub: [@raghavshahhh](https://github.com/raghavshahhh)
- Repository: [genz-restaurant-pos](https://github.com/raghavshahhh/genz-restaurant-pos)

## 🙏 Acknowledgments

- Menu data from GenZ Restaurant, Mahipalpur
- Built with Next.js, Prisma, and Supabase
- UI components from Radix UI and Tailwind CSS

## 🐛 Known Issues

- Role-based access control not fully enforced (planned)
- Real-time updates use polling (WebSocket planned)
- Image upload for menu items (coming soon)

## 🔮 Roadmap

- [ ] Real-time WebSocket updates
- [ ] Payment gateway integration (Razorpay)
- [ ] Customer loyalty program
- [ ] Inventory management
- [ ] Split bill functionality
- [ ] Table map view
- [ ] Multi-restaurant support
- [ ] Mobile app (React Native)

## 📞 Support

For issues and questions:
- Open an issue on GitHub
- Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

**⭐ Star this repo if you find it useful!**

Made with ❤️ for restaurant operations
