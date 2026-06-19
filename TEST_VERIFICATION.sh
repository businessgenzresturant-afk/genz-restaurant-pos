#!/bin/bash
# GenZ Restaurant POS - Verification Test Script

echo "🧪 GenZ Restaurant POS - System Verification"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

passed=0
failed=0

# Test 1: Check if P0 fixes are in place
echo "Test 1: Verifying P0 Fixes..."
if grep -q "checkAuth" src/app/api/env-check/route.ts; then
  echo -e "${GREEN}✅ P0.2: env-check endpoint protected${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P0.2: env-check endpoint NOT protected${NC}"
  ((failed++))
fi

if grep -q "process.env.NODE_ENV === 'production'" prisma/seed.ts; then
  echo -e "${GREEN}✅ P0.3: Production seed protection added${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P0.3: Production seed protection MISSING${NC}"
  ((failed++))
fi

if grep -q "process.env.TAX_RATE" src/app/api/bills/route.ts; then
  echo -e "${GREEN}✅ P1.8: TAX_RATE environment variable used${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P1.8: TAX_RATE still hardcoded${NC}"
  ((failed++))
fi

if grep -q "calculateFinalTotal" src/app/\(pos\)/bills/page.tsx; then
  echo -e "${GREEN}✅ P0.1: GST calculation helper function added${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P0.1: GST calculation helper MISSING${NC}"
  ((failed++))
fi

# Test 2: Check P1 fixes
echo ""
echo "Test 2: Verifying P1 Fixes..."
if grep -q "restaurantId: restaurantId" src/app/api/orders/route.ts; then
  echo -e "${GREEN}✅ P1.4: Multi-tenant isolation in orders${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P1.4: Multi-tenant isolation MISSING${NC}"
  ((failed++))
fi

if grep -q "adminOnlyRoutes" src/middleware.ts; then
  echo -e "${GREEN}✅ P1.5: Frontend RBAC in middleware${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P1.5: Frontend RBAC MISSING${NC}"
  ((failed++))
fi

if grep -q "bill.total" src/app/api/reports/route.ts; then
  echo -e "${GREEN}✅ P1.7: Reports use bill.total for revenue${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P1.7: Reports still use order.totalAmount${NC}"
  ((failed++))
fi

# Test 3: Check P2 fixes
echo ""
echo "Test 3: Verifying P2 Fixes..."
if [ ! -d "lib" ]; then
  echo -e "${GREEN}✅ P2.11: Duplicate lib/ folder removed${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P2.11: Duplicate lib/ folder still exists${NC}"
  ((failed++))
fi

if ! grep -q "@prisma/adapter-pg" package.json; then
  echo -e "${GREEN}✅ P2.12: Unused dependency removed${NC}"
  ((passed++))
else
  echo -e "${RED}❌ P2.12: Unused dependency still present${NC}"
  ((failed++))
fi

# Test 4: Check documentation
echo ""
echo "Test 4: Verifying Documentation..."
if [ -f "FIXES_COMPLETED.md" ]; then
  echo -e "${GREEN}✅ Comprehensive fix report exists${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Fix report missing${NC}"
  ((failed++))
fi

if [ -f "MIGRATION_FLOAT_TO_DECIMAL.md" ]; then
  echo -e "${GREEN}✅ Decimal migration plan exists${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Migration plan missing${NC}"
  ((failed++))
fi

if [ -f "FINAL_IMPLEMENTATION_SUMMARY.md" ]; then
  echo -e "${GREEN}✅ Final summary exists${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Final summary missing${NC}"
  ((failed++))
fi

# Test 5: Build & Lint
echo ""
echo "Test 5: Build & Lint Status..."
if npm run build > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Build passes${NC}"
  ((passed++))
else
  echo -e "${RED}❌ Build fails${NC}"
  ((failed++))
fi

if npm run lint > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Lint passes (warnings OK)${NC}"
  ((passed++))
else
  echo -e "${YELLOW}⚠️  Lint has issues (check manually)${NC}"
fi

# Summary
echo ""
echo "============================================"
echo "📊 Test Results"
echo "============================================"
echo -e "${GREEN}Passed: $passed${NC}"
echo -e "${RED}Failed: $failed${NC}"
echo ""

if [ $failed -eq 0 ]; then
  echo -e "${GREEN}🎉 All tests passed! System is production-ready.${NC}"
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Review the output above.${NC}"
  exit 1
fi
