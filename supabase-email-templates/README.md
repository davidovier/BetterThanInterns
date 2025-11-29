# Supabase Email Templates for Better Than Interns

This folder contains professionally designed email templates for all Supabase authentication emails. These templates are branded for Better Than Interns with a clean, modern design and helpful copy.

## Templates Included

1. **01-confirm-signup.html** - Confirmation email sent when users sign up
2. **02-magic-link.html** - Magic link for passwordless login
3. **03-reset-password.html** - Password reset email
4. **04-invite-user.html** - Workspace invitation email
5. **05-change-email.html** - Email address change confirmation

## Design Features

- **Professional branding** with Better Than Interns logo and colors
- **Responsive design** that works on desktop and mobile
- **Clear CTAs** with prominent action buttons
- **Security messaging** to educate users about safe practices
- **Helpful context** about what to do next
- **Brand voice** - smart, witty, and helpful (matching your product)
- **Inline CSS** for maximum email client compatibility
- **Table-based layout** for reliable rendering across email clients

## How to Add Templates to Supabase

### Step 1: Access Your Supabase Dashboard

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in to your account
3. Select your **BetterThanInterns** project

### Step 2: Navigate to Email Templates

1. In the left sidebar, click **Authentication**
2. Click **Email Templates** in the sub-menu
3. You'll see a list of all available email types

### Step 3: Update Each Template

For each email type, follow these steps:

#### **Confirm Signup**

1. Click on **"Confirm signup"** in the email templates list
2. You'll see two fields:
   - **Subject line**: Keep the default or customize to: `Confirm your email - Better Than Interns`
3. In the **Message Body (HTML)** section:
   - Delete all existing content
   - Open `01-confirm-signup.html` from this folder
   - Copy the entire HTML content
   - Paste it into the Message Body field
4. Click **Save** at the bottom

#### **Magic Link**

1. Click on **"Magic Link"** in the email templates list
2. **Subject line**: `Your magic link to Better Than Interns`
3. **Message Body (HTML)**:
   - Delete existing content
   - Copy content from `02-magic-link.html`
   - Paste and save

#### **Reset Password**

1. Click on **"Reset Password"** in the email templates list
2. **Subject line**: `Reset your password - Better Than Interns`
3. **Message Body (HTML)**:
   - Delete existing content
   - Copy content from `03-reset-password.html`
   - Paste and save

#### **Invite User**

1. Click on **"Invite User"** in the email templates list
2. **Subject line**: `You've been invited to Better Than Interns`
3. **Message Body (HTML)**:
   - Delete existing content
   - Copy content from `04-invite-user.html`
   - Paste and save

#### **Change Email Address**

1. Click on **"Change Email Address"** in the email templates list
2. **Subject line**: `Confirm your new email address`
3. **Message Body (HTML)**:
   - Delete existing content
   - Copy content from `05-change-email.html`
   - Paste and save

### Step 4: Test Your Templates

Supabase provides a way to send test emails:

1. In the email templates page, look for a **"Send test email"** option
2. Enter your email address
3. Click send to preview how the email looks in your inbox
4. Check the email on both desktop and mobile devices
5. Verify all links work correctly

## Important Notes

### Variables Used in Templates

All templates use Supabase's standard template variables:

- `{{ .ConfirmationURL }}` - The action link (signup, login, reset, etc.)
- `{{ .Email }}` - The user's email address
- `{{ .Token }}` - Authentication token (not displayed, used in URLs)
- `{{ .SiteURL }}` - Your application URL

**DO NOT** modify these variable names or the templates will break.

### Email Provider Configuration

For production use, you should configure a custom email provider:

1. Go to **Authentication** → **Providers** → **Email**
2. Toggle **"Enable custom SMTP"**
3. Configure your SMTP settings (recommended providers):
   - **SendGrid** (free tier: 100 emails/day)
   - **Mailgun** (free tier: 5,000 emails/month)
   - **AWS SES** (very affordable, requires AWS account)
   - **Postmark** (great for transactional emails)

**Why use custom SMTP?**
- Supabase's built-in email has strict rate limits
- Better deliverability and sender reputation
- Professional "from" address (noreply@yourdomain.com)
- Detailed analytics and tracking

### Customization Tips

If you want to further customize these templates:

1. **Colors**: The primary brand color is `#3f51b5` (blue). Search and replace to change.
2. **Logo**: Currently using text logo. To add an image logo:
   ```html
   <img src="https://yourdomain.com/logo.png" alt="Better Than Interns" width="200" style="display: block; margin: 0 auto;">
   ```
3. **Footer links**: Add support/help links in the footer section
4. **Social media**: Add social media icons if desired
5. **Unsubscribe**: Add unsubscribe links if required by your use case

### Brand Guidelines

These templates follow Better Than Interns brand voice:

- **Smart**: We know what we're talking about
- **Witty**: A touch of humor without being unprofessional
- **Helpful**: Clear next steps, security tips, context
- **No nonsense**: Direct communication, no corporate fluff

Examples from the templates:
- "Think of it as your smart consultant that never asks for coffee breaks"
- "Start with something ugly. That's where the value is"
- "No passwords, no friction"

Feel free to adjust the copy to match your evolving brand voice.

## Troubleshooting

### Emails not being received

1. Check your spam folder
2. Verify SMTP settings if using custom provider
3. Check Supabase logs: **Authentication** → **Logs**
4. Ensure email confirmations are enabled: **Authentication** → **Providers** → **Email** → **Confirm email** (toggled on)

### Links not working

1. Verify `SITE_URL` is set correctly in **Authentication** → **URL Configuration**
2. Check that redirect URLs are whitelisted in **Authentication** → **URL Configuration** → **Redirect URLs**

### Template variables not rendering

1. Make sure you're using the exact variable names: `{{ .ConfirmationURL }}` not `{{ .confirmationURL }}`
2. Variables are case-sensitive
3. Don't remove the `{{ }}` syntax

### Styling issues

1. Always use inline CSS: `<p style="color: red;">` not `<p class="red">`
2. Avoid external CSS files or `<style>` tags
3. Use tables for layout instead of divs/flexbox
4. Test in multiple email clients (Gmail, Outlook, Apple Mail)

## Need Help?

If you encounter issues with these templates:

1. Check the Supabase documentation: [https://supabase.com/docs/guides/auth/auth-email-templates](https://supabase.com/docs/guides/auth/auth-email-templates)
2. Review Supabase logs for error messages
3. Test with Supabase's test email feature
4. Verify your SMTP provider settings if using custom email

## Version History

- **v1.0** (2025-01-29) - Initial templates created
  - All 5 email types designed and tested
  - Better Than Interns branding applied
  - Responsive design implemented
  - Security messaging added

---

**Happy emailing!** Your users will appreciate the professional, helpful email experience.
