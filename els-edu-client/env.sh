#!/bin/sh
set -e

echo "🔧 Generating runtime environment configuration..."

# Create runtime config file with environment variables
cat > /usr/share/nginx/html/config.js << EOF
// Runtime environment configuration
// This file is generated at container startup
window.ENV = {
  VITE_API_URL: "${VITE_API_URL:-https://emeelan.com/els-learners-server}",
  VITE_ABLY_API_KEY: "${VITE_ABLY_API_KEY:-CAtV_w.YQ2YJA:CFTY08KNi__TxbRH5bTjFRgjWPUjYwj8mCLFNtccCeA}",
  VITE_CASHFREE_ENV: "${VITE_CASHFREE_ENV:-production}"
};

// Log configuration for debugging (remove in production if sensitive)
console.log('Environment loaded:', {
  apiUrl: window.ENV.VITE_API_URL,
  cashfreeEnv: window.ENV.VITE_CASHFREE_ENV
});
EOF

echo "✅ Environment configuration generated successfully"
echo "   API URL: ${VITE_API_URL:-https://emeelan.com/els-learners-server}"
echo "   Cashfree: ${VITE_CASHFREE_ENV:-production}"
