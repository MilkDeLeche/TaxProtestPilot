# TaxPilot - Property Tax Dashboard

## Original Problem Statement
Build a SaaS dashboard for Property Tax Professionals called "TaxPilot" with:
- Modern, clean, sidebar-navigation layout using React, Tailwind CSS, and Supabase
- Framer Motion animations (whileHover, whileTap, fade-in-up on scroll)
- Glassmorphism cards with Deep Blue (#1e40af) accents
- Supabase for database and Google OAuth authentication

## User Personas
- **Property Tax Professionals**: Need to manage clients and calculate potential tax savings
- **Tax Consultants**: Upload property data and generate savings reports for clients

## Core Requirements (Static)
1. Login/Auth with Google OAuth via Supabase
2. Customers management page (CRUD table)
3. Settings page for fee configuration
4. Upload & Calculate page (CSV upload, column mapping, tax savings calculation)
5. Sidebar navigation layout

## What's Been Implemented (Jan 2026)
- ✅ **Landing Page** (Marketing/Sales page):
  - Hero section with animated headline, CTAs, and dashboard mockup
  - Features section with Bento grid layout (6 features)
  - How It Works section (3 steps)
  - Pricing section with 3 tiers (Starter $29, Professional $79, Enterprise Custom)
  - CTA section with call to action
  - Footer with navigation links
  - Sticky navbar with glass effect on scroll
  - Mobile responsive with hamburger menu
- ✅ Complete UI with glassmorphism design
- ✅ Framer Motion animations on all interactive elements
- ✅ Login page with Google OAuth button (slide-in animation)
- ✅ Protected routes with authentication state management
- ✅ Dashboard page with stats overview
- ✅ Customers page with table, search, and Add Customer modal
- ✅ Settings page with 4 fee configuration inputs
- ✅ Upload & Calculate page with:
  - Drag-and-drop CSV upload zone (with pulse animation)
  - Column mapping dropdowns
  - Calculate Savings functionality
  - Results table with export to CSV
  - Summary statistics
- ✅ Responsive sidebar navigation
- ✅ Data-testid attributes for all interactive elements

## Pending Setup (User Action Required)
### 1. Supabase Google OAuth Configuration
In Supabase Dashboard → Authentication → Providers → Google:
- Enable Google provider
- Add Google OAuth Client ID and Secret from Google Cloud Console
- Set redirect URL to: https://taxcalc-pro-1.preview.emergentagent.com/auth/callback

### 2. Supabase Database Tables
Run this SQL in Supabase Dashboard → SQL Editor:

```sql
-- Customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  name TEXT NOT NULL,
  property_id TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own customers
CREATE POLICY "Users can view own customers" ON customers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own customers" ON customers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own customers" ON customers
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own customers" ON customers
  FOR DELETE USING (auth.uid() = user_id);

-- Settings table
CREATE TABLE settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  contingency_fee_pct NUMERIC DEFAULT 0,
  flat_fee NUMERIC DEFAULT 0,
  tax_rate_pct NUMERIC DEFAULT 0,
  min_savings_threshold NUMERIC DEFAULT 0,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable Row Level Security
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see/edit their own settings
CREATE POLICY "Users can view own settings" ON settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON settings
  FOR UPDATE USING (auth.uid() = user_id);
```

## Prioritized Backlog
### P0 (Critical)
- [x] Core UI implementation
- [x] Authentication flow
- [ ] User must configure Google OAuth in Supabase

### P1 (High)
- [ ] User must create database tables in Supabase
- [ ] Add data validation on upload

### P2 (Medium)
- [ ] Add customer edit/delete functionality
- [ ] Add pagination for large datasets
- [ ] Email notifications for recommendations

## Next Tasks
1. User to configure Google OAuth provider in Supabase Dashboard
2. User to run SQL to create customers and settings tables
3. Test full authentication flow after setup
