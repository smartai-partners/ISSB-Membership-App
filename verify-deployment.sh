#!/bin/bash

echo "================================"
echo "Phase 3C.2 Deployment Verification"
echo "================================"
echo ""

URL="https://1dnr11xqb8pk.space.minimax.io"

echo "1. Testing site accessibility..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✅ Site is accessible (HTTP $HTTP_CODE)"
else
    echo "   ❌ Site returned HTTP $HTTP_CODE"
    exit 1
fi
echo ""

echo "2. Checking HTML content..."
HTML=$(curl -s "$URL")

# Check for React root
if echo "$HTML" | grep -q 'id="root"'; then
    echo "   ✅ React root element found"
else
    echo "   ❌ React root element NOT found"
fi

# Check for JS bundle
BUNDLE=$(echo "$HTML" | grep -o 'assets/index-[^"]*\.js' | head -1)
if [ -n "$BUNDLE" ]; then
    echo "   ✅ JavaScript bundle found: $BUNDLE"
    BUNDLE_URL="$URL/$BUNDLE"
else
    echo "   ❌ JavaScript bundle NOT found"
    exit 1
fi

# Check for CSS bundle
CSS=$(echo "$HTML" | grep -o 'assets/index-[^"]*\.css' | head -1)
if [ -n "$CSS" ]; then
    echo "   ✅ CSS bundle found: $CSS"
else
    echo "   ❌ CSS bundle NOT found"
fi
echo ""

echo "3. Downloading and analyzing JavaScript bundle..."
curl -s "$BUNDLE_URL" > /tmp/bundle.js
BUNDLE_SIZE=$(stat -f%z /tmp/bundle.js 2>/dev/null || stat -c%s /tmp/bundle.js 2>/dev/null)
echo "   Bundle size: $(numfmt --to=iec-i --suffix=B $BUNDLE_SIZE 2>/dev/null || echo $BUNDLE_SIZE bytes)"
echo ""

echo "4. Checking for Phase 3C.2 components in bundle..."
COMPONENTS_FOUND=0

# These strings should appear in the minified bundle even if obfuscated
if grep -q "accessibility-audit" /tmp/bundle.js; then
    echo "   ✅ Accessibility audit routes found"
    ((COMPONENTS_FOUND++))
fi

if grep -q "admin" /tmp/bundle.js; then
    echo "   ✅ Admin routes found"
    ((COMPONENTS_FOUND++))
fi

# Check for TanStack Query usage
if grep -q "useQuery\|useMutation" /tmp/bundle.js; then
    echo "   ✅ TanStack Query hooks found"
    ((COMPONENTS_FOUND++))
fi

# Check for Supabase
if grep -q "supabase" /tmp/bundle.js; then
    echo "   ✅ Supabase integration found"
    ((COMPONENTS_FOUND++))
fi

# Check for filter-related text
if grep -q -i "filter\|severity\|status" /tmp/bundle.js; then
    echo "   ✅ Filter-related functionality found"
    ((COMPONENTS_FOUND++))
fi

# Check for bulk operations
if grep -q -i "bulk\|select.*all" /tmp/bundle.js; then
    echo "   ✅ Bulk operations functionality found"
    ((COMPONENTS_FOUND++))
fi

echo ""
echo "5. Summary"
echo "   Components/Features detected: $COMPONENTS_FOUND/6"

if [ $COMPONENTS_FOUND -ge 4 ]; then
    echo "   ✅ Phase 3C.2 deployment appears valid"
    EXIT_CODE=0
else
    echo "   ⚠️  Some components may be missing"
    EXIT_CODE=1
fi

echo ""
echo "================================"
echo "Manual Testing Required:"
echo "1. Login to: $URL"
echo "2. Navigate to: Admin Dashboard → Accessibility Audit"
echo "3. Verify enhanced page with filters and bulk operations"
echo "4. Follow testing guide: /workspace/phase3c2-manual-testing-guide.md"
echo "================================"

rm -f /tmp/bundle.js
exit $EXIT_CODE
