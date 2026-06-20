#!/bin/bash

# GenZ Restaurant POS - Deployment Script
# This script helps push code to GitHub and deploy to Vercel

echo "🚀 GenZ Restaurant POS - Deployment Script"
echo "=========================================="

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Check if git is initialized
if [ ! -d .git ]; then
    echo -e "${RED}❌ Git repository not found!${NC}"
    echo "Initialize git first: git init"
    exit 1
fi

echo -e "${GREEN}✅ Git repository found${NC}"

# Step 2: Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}📝 Uncommitted changes found${NC}"
    git status -s
    
    read -p "Commit message: " commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Update: $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git add .
    git commit -m "$commit_msg"
    echo -e "${GREEN}✅ Changes committed${NC}"
else
    echo -e "${GREEN}✅ No uncommitted changes${NC}"
fi

# Step 3: Push to GitHub
echo -e "${YELLOW}📤 Pushing to GitHub...${NC}"
git push origin main || git push origin master

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Code pushed to GitHub successfully!${NC}"
else
    echo -e "${RED}❌ Failed to push to GitHub${NC}"
    echo "Make sure you have set up remote: git remote add origin <your-repo-url>"
    exit 1
fi

# Step 4: Deployment instructions
echo ""
echo -e "${GREEN}=========================================="
echo "✅ CODE PUSHED TO GITHUB SUCCESSFULLY!"
echo "==========================================${NC}"
echo ""
echo "📋 Next Steps for Vercel Deployment:"
echo ""
echo "1. Go to https://vercel.com"
echo "2. Click 'Add New Project'"
echo "3. Import: raghavshahhh/genz-restaurant-pos"
echo "4. Add Environment Variables:"
echo "   - DATABASE_URL (from Supabase)"
echo "   - DIRECT_URL (from Supabase)"
echo "   - NEXTAUTH_URL (https://pos.gen-z.online)"
echo "   - NEXTAUTH_SECRET (your secret key)"
echo "5. Click 'Deploy'"
echo ""
echo "📖 Full guide: ./DEPLOYMENT_GUIDE.md"
echo ""
