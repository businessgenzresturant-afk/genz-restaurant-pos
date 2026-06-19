# 🚀 Deployment Checklist - GenZ Restaurant POS

Use this checklist to ensure a smooth deployment of all features, especially the new Sections 7 & 8.

---

## ✅ PRE-DEPLOYMENT

### 1. Code Quality
- [x] All TypeScript errors resolved (0 errors)
- [x] Build successful (`npm run build`)
- [x] Prisma schema validated
- [x] Prisma Client generated
- [ ] All ESLint warnings reviewed (only image optimization warnings remain)

### 2. Database
- [ ] Database backup created
  ```bash
  pg_dump your_database > backup_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Backup verified and downloadable
- [ ] Database connection string updated for production
- [ ] Migrations ready to run in production
  ```bash
  npx prisma migrate deploy
  ```

### 3. Environment Variables
- [ ] `.env.production` file created with production values
- [ ] `DATABASE_URL` set correctly
- [ ] `NEXTAUTH_URL` set to production domain
- [ ] `NEXTAUTH_SECRET` set (generate with: `openssl rand -base64 32`)
- [ ] All secrets secured and not in version control

### 4. Sound Files (Critical for Section 8)
- [ ] Downloaded real MP3 sound files
- [ ] Replaced `/public/sounds/new-order.mp3`
- [ ] Replaced `/public/sounds/urgent.mp3`
- [ ] Tested sounds in browser
- [ ] Verified file sizes < 100KB each
- [ ] Confirmed MP3 format compatibility

### 5. Dependencies
- [ ] All npm packages installed
- [ ] No security vulnerabilities (`npm audit`)
- [ ] Production dependencies only in build

---

## 🧪 TESTING

### Section 7: Item Cancellation
- [ ] Create order with 3+ items
- [ ] Cancel one item via "View All Items" → "Cancel" button
- [ ] Verify item shows with strikethrough
- [ ] Verify order total recalculated correctly
- [ ] Check KDS shows cancelled item with red styling
- [ ] Verify stock restored in menu management
- [ ] Try cancelling from COMPLETED order (should be blocked)
- [ ] Verify cancelled items still in database (audit trail)

### Section 8: KDS Sound System
- [ ] Open KDS page in browser
- [ ] Create new order from another tab
- [ ] Verify sound plays immediately
- [ ] Wait 30 seconds - sound should repeat
- [ ] Click "Acknowledge" button - sounds stop
- [ ] Toggle sound off/on - verify mute/unmute works
- [ ] Create order, wait 2 minutes, add items - verify urgent sound (3 beeps)
- [ ] Test multiple simultaneous orders - verify queue management
- [ ] Test in different browsers (Chrome, Firefox, Safari)

### Integration Testing
- [ ] Complete order flow: Order → Prepare → Ready → Serve → Bill → Pay
- [ ] Test with customer phone (loyalty points)
- [ ] Test split payment (cash + online)
- [ ] Test discount application
- [ ] Test half/full portions
- [ ] Test diet indicators display
- [ ] Test inventory decrement and stock alerts
- [ ] Test running table (add items to existing order)

### Performance Testing
- [ ] KDS polling performance (2-second interval)
- [ ] Page load times acceptable
- [ ] API response times < 500ms
- [ ] Sound latency < 200ms
- [ ] Multiple concurrent users (if possible)

---

## 📦 DEPLOYMENT

### Build & Deploy
- [ ] Run production build
  ```bash
  npm run build
  ```
- [ ] Review build output for errors/warnings
- [ ] Test production build locally
  ```bash
  npm start
  ```
- [ ] Deploy to hosting platform (Vercel/Railway/etc.)
  ```bash
  # Example for Vercel
  vercel --prod
  
  # Or Railway
  railway up
  ```

### Database Migration
- [ ] Run migrations on production database
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Verify schema changes applied
  ```bash
  npx prisma studio
  ```
- [ ] Check all tables exist (Customer, PointTransaction, etc.)
- [ ] Verify enums created (ItemStatus, DietType, etc.)

### Post-Deployment Verification
- [ ] Application accessible at production URL
- [ ] Login works with test credentials
- [ ] All pages load without errors
- [ ] API endpoints responding
- [ ] Database connections working
- [ ] KDS real-time updates working
- [ ] Sounds playing in production
- [ ] Check browser console for errors (F12)

---

## 👥 STAFF TRAINING

### For Waiters/Order Takers (30 minutes)
- [ ] Show how to take orders with new features:
  - [ ] Diet indicators (green = veg, red = non-veg)
  - [ ] Half/full portion selection
  - [ ] Special instructions field
- [ ] Demonstrate item cancellation:
  - [ ] Navigate to active orders
  - [ ] Click "View All Items"
  - [ ] Cancel an item
  - [ ] Show updated total
- [ ] Explain limitations:
  - [ ] Can't cancel completed orders
  - [ ] Stock automatically restored
  - [ ] Kitchen sees cancellation

### For Kitchen Staff (20 minutes)
- [ ] Explain KDS visual indicators:
  - [ ] Green pulse = NEW item (just added)
  - [ ] Red strikethrough = CANCELLED item
  - [ ] Red background = URGENT running table
- [ ] Demonstrate sound system:
  - [ ] Standard beep for new orders
  - [ ] Triple beep for urgent additions
  - [ ] How to acknowledge alerts
  - [ ] How to toggle sound on/off
- [ ] Best practices:
  - [ ] Keep sound enabled during service
  - [ ] Acknowledge once order seen
  - [ ] Don't prepare cancelled items
  - [ ] Pay attention to urgent alerts

### For Managers/Cashiers (30 minutes)
- [ ] Complete payment flow with all features:
  - [ ] Customer phone capture
  - [ ] Points earning calculation
  - [ ] Points redemption
  - [ ] Discount application (max 30%)
  - [ ] Split payment (cash + online)
  - [ ] Print bill
- [ ] Menu management:
  - [ ] Update stock quantities
  - [ ] Toggle availability
  - [ ] Set diet types
  - [ ] Configure half/full pricing
- [ ] Reports and monitoring:
  - [ ] Check daily revenue
  - [ ] Review popular items
  - [ ] Monitor inventory levels

---

## 📋 MONITORING

### First Day
- [ ] Monitor application logs for errors
- [ ] Watch for performance issues
- [ ] Check sound system working in kitchen
- [ ] Verify item cancellations working
- [ ] Ensure loyalty points calculating correctly
- [ ] Monitor database performance

### First Week
- [ ] Review staff feedback
- [ ] Check for common user errors
- [ ] Analyze most-used features
- [ ] Identify any pain points
- [ ] Gather improvement suggestions

### Ongoing
- [ ] Daily database backups automated
- [ ] Weekly security updates
- [ ] Monthly performance review
- [ ] Quarterly feature assessment

---

## 🆘 ROLLBACK PLAN

### If Critical Issues Found

**Option 1: Quick Fix**
- [ ] Identify the issue
- [ ] Apply hotfix
- [ ] Deploy patch
- [ ] Verify fix

**Option 2: Full Rollback**
- [ ] Stop production server
- [ ] Restore database from backup
  ```bash
  psql your_database < backup_YYYYMMDD_HHMMSS.sql
  ```
- [ ] Deploy previous version of code
- [ ] Verify system working
- [ ] Investigate issue in development

### Emergency Contacts
- Developer: __________________
- Database Admin: __________________
- Server Admin: __________________

---

## 📞 POST-DEPLOYMENT SUPPORT

### Common Issues & Solutions

**Issue: Sounds not playing in production**
- Check browser console for audio errors
- Verify sound files deployed correctly
- Test autoplay policy (click page first)
- Check file paths are correct (`/sounds/...`)

**Issue: Item cancellation not working**
- Verify API endpoint deployed
- Check database schema has ItemStatus enum
- Review browser console for API errors
- Verify user has proper permissions

**Issue: KDS not updating in real-time**
- Check network tab for polling requests
- Verify 2-second interval working
- Check for CORS issues
- Ensure WebSocket/polling not blocked

**Issue: Loyalty points not calculating**
- Verify customer phone captured
- Check PointTransaction table has entries
- Review point earning rate constant
- Confirm customer created in database

---

## ✅ SIGN-OFF

### Pre-Deployment Sign-Off
- [ ] Developer: __________________ Date: __________
- [ ] QA Tester: __________________ Date: __________
- [ ] Manager: ____________________ Date: __________

### Post-Deployment Sign-Off
- [ ] Deployment Successful: __________________ Date: __________
- [ ] Testing Complete: ______________________ Date: __________
- [ ] Staff Trained: _________________________ Date: __________
- [ ] Production Ready: ______________________ Date: __________

---

## 🎉 SUCCESS CRITERIA

System is considered successfully deployed when:

✅ All 10 sections functional in production  
✅ Zero critical errors in logs  
✅ Staff trained and comfortable with new features  
✅ Sound alerts working in kitchen  
✅ Item cancellation workflow tested  
✅ Loyalty program calculating correctly  
✅ Performance meets targets (<2s page load)  
✅ All backups automated  

---

**Deployed By**: _______________________  
**Date**: _______________________  
**Version**: 1.0.0 (All 10 sections complete)  
**Notes**: _______________________

---

🎊 **Congratulations on deploying your complete GenZ Restaurant POS system!** 🎊
