#!/bin/bash

# Installation script for routing infrastructure dependencies
# Run this script after setting up the routing infrastructure

echo "=================================="
echo "Routing Infrastructure Setup"
echo "=================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found."
    echo "Please run this script from the apps/web directory."
    exit 1
fi

echo "📦 Installing required dependencies for routing infrastructure..."
echo ""

# Install framer-motion for animations
echo "Installing framer-motion..."
npm install framer-motion

if [ $? -eq 0 ]; then
    echo "✅ framer-motion installed successfully"
else
    echo "❌ Failed to install framer-motion"
    exit 1
fi

# Install react-error-boundary for error handling
echo "Installing react-error-boundary..."
npm install react-error-boundary

if [ $? -eq 0 ]; then
    echo "✅ react-error-boundary installed successfully"
else
    echo "❌ Failed to install react-error-boundary"
    exit 1
fi

echo ""
echo "=================================="
echo "✅ All dependencies installed!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Run 'npm run type-check' to verify TypeScript types"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Review the routing documentation in src/routing/README.md"
echo "4. Follow the migration guide in src/routing/MIGRATION_GUIDE.md"
echo ""
echo "For more information, see:"
echo "- src/routing/README.md"
echo "- src/routing/IMPLEMENTATION_SUMMARY.md"
echo "- src/routing/MIGRATION_GUIDE.md"
echo ""