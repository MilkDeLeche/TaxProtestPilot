# Support Email Setup Guide

This guide explains how to configure the support/contact email in Tax Protest Pilot and what you need for production.

---

## Current Setup (Mailto)

The app uses **mailto links**. When a user fills the support form and clicks "Open email to send":

1. Their default email client (Gmail, Outlook, Apple Mail, etc.) opens
2. The email is pre-filled with your address, subject, and message
3. The user sends the email from **their own** email client

**No backend or email service is required** for this approach.

---

## Where to Put Your Email

### 1. Main configuration

**File:** `frontend/src/pages/Support.jsx`  
**Line:** ~20

```javascript
const SUPPORT_EMAIL = 'support@taxprotestpilot.com';  // ← Change this to your email
```

Replace `support@taxprotestpilot.com` with your actual email, for example:

- `you@gmail.com`
- `support@yourdomain.com`
- `hello@yourcompany.com`

All support links and the contact form will use this address.

---

## Is It Production Ready?

### Yes, for the mailto approach

| Requirement | Status |
|-------------|--------|
| User can reach you | ✅ Yes – their email client opens with your address |
| Works without backend | ✅ Yes |
| Works on mobile | ✅ Yes (opens default mail app) |
| Works without email client | ❌ No – user must have one configured |

### What you need to do

1. **Change the email** in `Support.jsx` to your real address.
2. **Receive emails** – Make sure you can receive mail at that address:
   - If using Gmail/Outlook: you already can
   - If using `support@yourdomain.com`: set up email on your domain (e.g. Google Workspace, Zoho, etc.)

That’s all you need for the current setup.

---

## Optional: Backend Form Submission

If you want the form to **send** emails without opening the user’s client (e.g. for users without an email app), you need a backend.

### Option A: Form service (no backend code)

Use a hosted form service. They receive the submission and email you.

1. **Formspree** – https://formspree.io  
   - Free tier: 50 submissions/month  
   - Sign up, create a form, get an endpoint URL  
   - Change the form to `POST` to that URL instead of using mailto  

2. **Getform** – https://getform.io  
   - Similar to Formspree  

3. **Web3Forms** – https://web3forms.com  
   - Free, no signup for basic use  

### Option B: Your own backend

Add an API endpoint that sends email (e.g. via SendGrid, Resend, AWS SES, or SMTP) and update the frontend to POST the form data to that endpoint instead of using mailto.

---

## Quick Checklist

- [ ] Change `SUPPORT_EMAIL` in `frontend/src/pages/Support.jsx` to your email
- [ ] Ensure you can receive mail at that address
- [ ] (Optional) If you want backend form submission, choose a form service or add your own endpoint
