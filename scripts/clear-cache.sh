#!/bin/bash
# Script para limpar cache antes do build
echo "Limpando cache npm..."
npm cache clean --force 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/.npm 2>/dev/null || true
echo "Cache limpo!"
