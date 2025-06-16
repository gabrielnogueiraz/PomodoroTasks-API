#!/bin/bash
echo "🏗️ Building Toivo Backend for Railway..."
echo "======================================"

# Instalar dependências
echo "📦 Installing dependencies..."
npm ci

# Build do TypeScript
echo "🔧 Building TypeScript..."
npm run build

# Verificar se build foi bem-sucedido
if [ -f "dist/server.js" ]; then
    echo "✅ Build completed successfully!"
    echo "📁 Generated: dist/server.js"
    ls -la dist/
else
    echo "❌ Build failed - dist/server.js not found"
    exit 1
fi

echo "🚀 Ready for deployment!"
