-- Migration: Add Shopify Stores and Products
-- Run this SQL in your PostgreSQL database

-- Create ShopifyStore table
CREATE TABLE IF NOT EXISTS "ShopifyStore" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  "accessToken" VARCHAR(255) NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "lastSyncAt" TIMESTAMP,
  "productCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create ShopifyProduct table
CREATE TABLE IF NOT EXISTS "ShopifyProduct" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "storeId" UUID NOT NULL REFERENCES "ShopifyStore"(id) ON DELETE CASCADE,
  "shopifyId" VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(500) NOT NULL,
  handle VARCHAR(255),
  "productType" VARCHAR(255),
  vendor VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  image TEXT,
  price DECIMAL(10, 2),
  "compareAtPrice" DECIMAL(10, 2),
  variants TEXT,
  "syncedAt" TIMESTAMP,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW(),
  UNIQUE("storeId", "shopifyId")
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shopify_product_store ON "ShopifyProduct"("storeId");
CREATE INDEX IF NOT EXISTS idx_shopify_store_domain ON "ShopifyStore"(domain);