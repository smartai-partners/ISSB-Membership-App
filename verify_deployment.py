#!/usr/bin/env python3
import urllib.request
import json
import re

def verify_deployment():
    url = "https://1dnr11xqb8pk.space.minimax.io"
    print("=" * 60)
    print("Phase 3C.2 Deployment Verification")
    print("=" * 60)
    print()
    
    try:
        # Test 1: Site accessibility
        print("1. Testing site accessibility...")
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            status = response.status
            html = response.read().decode('utf-8')
            print(f"   ✅ Site is accessible (HTTP {status})")
        print()
        
        # Test 2: Check HTML structure
        print("2. Checking HTML content...")
        if 'id="root"' in html:
            print("   ✅ React root element found")
        else:
            print("   ❌ React root element NOT found")
            
        # Find JS bundle
        js_match = re.search(r'assets/index-[^"]+\.js', html)
        if js_match:
            bundle_path = js_match.group(0)
            print(f"   ✅ JavaScript bundle found: {bundle_path}")
            bundle_url = f"{url}/{bundle_path}"
        else:
            print("   ❌ JavaScript bundle NOT found")
            return False
            
        # Find CSS bundle
        css_match = re.search(r'assets/index-[^"]+\.css', html)
        if css_match:
            print(f"   ✅ CSS bundle found: {css_match.group(0)}")
        else:
            print("   ❌ CSS bundle NOT found")
        print()
        
        # Test 3: Analyze bundle
        print("3. Downloading and analyzing JavaScript bundle...")
        with urllib.request.urlopen(bundle_url) as response:
            bundle = response.read().decode('utf-8')
            bundle_size = len(bundle)
            print(f"   Bundle size: {bundle_size:,} bytes ({bundle_size / 1024 / 1024:.2f} MB)")
        print()
        
        # Test 4: Check for Phase 3C.2 features
        print("4. Checking for Phase 3C.2 components...")
        checks = [
            ("accessibility-audit", "Accessibility audit routes"),
            ("admin", "Admin routes"),
            ("filter", "Filter functionality"),
            ("bulk", "Bulk operations"),
            ("supabase", "Supabase integration"),
            ("useQuery", "TanStack Query hooks"),
        ]
        
        found = 0
        for search_term, description in checks:
            if search_term.lower() in bundle.lower():
                print(f"   ✅ {description} found")
                found += 1
            else:
                print(f"   ❌ {description} NOT found")
        
        print()
        print("5. Summary")
        print(f"   Components/Features detected: {found}/{len(checks)}")
        
        if found >= 4:
            print("   ✅ Phase 3C.2 deployment appears valid")
            status = True
        else:
            print("   ⚠️  Some components may be missing")
            status = False
            
        print()
        print("=" * 60)
        print("Manual Testing Required:")
        print(f"1. Login to: {url}")
        print("2. Navigate to: Admin Dashboard → Accessibility Audit")
        print("3. Verify enhanced page with filters and bulk operations")
        print("4. Follow: /workspace/phase3c2-manual-testing-guide.md")
        print("=" * 60)
        
        return status
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    verify_deployment()
