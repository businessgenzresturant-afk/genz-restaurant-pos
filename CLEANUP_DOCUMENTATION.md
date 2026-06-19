# Documentation Cleanup Plan

## Issue
Repository contains 100+ status/debug markdown files that clutter the codebase and make navigation difficult.

## Priority
P3 - Low (doesn't affect functionality but reduces maintainability)

## Files to Archive/Delete

### Status Files (Can be deleted - temporary tracking)
- `LOGIN_FIX_URGENT.md`
- `FORCE_REDEPLOY_NOW.md`
- `DEPLOYMENT_STATUS.md`
- `MIDDLEWARE_FIX_*.md`
- Various `*_STATUS.md` files

### Implementation Logs (Archive to `.remember/archive.md` or delete)
- `IMPLEMENTATION_LOG.md`
- `DEPLOYMENT_CHECKLIST.md`
- Temporary troubleshooting guides

### Keep (Core Documentation)
- `README.md` - Main project documentation
- `DEPLOYMENT_GUIDE.md` - Production deployment instructions
- `MIGRATION_FLOAT_TO_DECIMAL.md` - Technical migration guide
- `COMPREHENSIVE_RESTAURANT_POS_AUDIT_REPORT.md` - This audit report
- `IMPLEMENTATION_SUMMARY.md` - Final implementation summary

## Cleanup Commands

```bash
# Create archive directory
mkdir -p .archive/docs

# Move status files to archive
mv *_STATUS*.md .archive/docs/ 2>/dev/null
mv *_FIX_*.md .archive/docs/ 2>/dev/null
mv *_URGENT*.md .archive/docs/ 2>/dev/null

# Or delete if not needed
# rm *_STATUS*.md *_FIX_*.md *_URGENT*.md

# Clean up duplicate documentation
find . -name "*.md" -type f | sort | uniq -d | xargs rm

# Keep only essential docs in root
ls *.md | grep -v -E "(README|DEPLOYMENT_GUIDE|MIGRATION|AUDIT|IMPLEMENTATION)" | xargs mv -t .archive/docs/
```

## Recommended Documentation Structure

```
GenZ_Restaurant_POS/
├── README.md                              # Main project overview
├── DEPLOYMENT_GUIDE.md                    # Production deployment
├── CONTRIBUTING.md                        # How to contribute
├── docs/
│   ├── api/
│   │   ├── authentication.md
│   │   ├── orders.md
│   │   └── bills.md
│   ├── architecture/
│   │   ├── database-schema.md
│   │   └── system-design.md
│   ├── migrations/
│   │   └── float-to-decimal.md
│   └── security/
│       ├── rbac.md
│       └── audit-report.md
└── .archive/
    └── docs/                              # Old/temporary docs
```

## Estimated Effort
- Review and categorize: 30 minutes
- Move/delete files: 15 minutes
- Update references: 15 minutes

**Total: ~1 hour**
