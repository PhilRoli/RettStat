#!/usr/bin/env bun

/**
 * Generate Supabase JWT tokens
 * Usage: bun scripts/generate-jwt.js <JWT_SECRET>
 */

import crypto from 'crypto';

// Base64 URL encoding
function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Create HMAC SHA256 signature
function sign(data, secret) {
  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate JWT
function generateJWT(payload, secret) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(`${encodedHeader}.${encodedPayload}`, secret);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Main
const secret = process.argv[2];

if (!secret) {
  console.error('Usage: node generate-jwt.js <JWT_SECRET>');
  process.exit(1);
}

const exp = 1983812996; // Year 2032

// Generate anon key
const anonPayload = {
  role: 'anon',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: exp
};

// Generate service_role key
const servicePayload = {
  role: 'service_role',
  iss: 'supabase',
  iat: Math.floor(Date.now() / 1000),
  exp: exp
};

const anonKey = generateJWT(anonPayload, secret);
const serviceKey = generateJWT(servicePayload, secret);

console.log('\n=== Supabase JWT Keys ===\n');
console.log('ANON_KEY:');
console.log(anonKey);
console.log('\nSERVICE_ROLE_KEY:');
console.log(serviceKey);
console.log('\nExpires:', new Date(exp * 1000).toISOString());
console.log('\nAdd these to your .env.production file:');
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY="${anonKey}"`);
console.log(`SUPABASE_SERVICE_ROLE_KEY="${serviceKey}"`);
console.log();
