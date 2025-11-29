#!/bin/bash

# Better Than Interns - Supabase Setup Script

echo "🚀 Setting up Better Than Interns with Supabase..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create .env file with your Supabase credentials"
    exit 1
fi

echo "✓ Environment file found"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo ""
echo "🔧 Generating Prisma client..."
npm run db:generate

# Push schema to Supabase
echo ""
echo "🗄️  Pushing database schema to Supabase..."
npm run db:push

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your OPENAI_API_KEY is set in .env"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
