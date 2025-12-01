# Lead Management App

A Next.js 14 application for managing sales leads backed by Google Sheets.

## Features
- **Two-way Sync**: Updates in the app reflect in Google Sheets immediately.
- **Offline Mode**: View cached data and queue updates while offline. Changes sync automatically upon reconnection.
- **Reminders**: Set date/time reminders for leads, visible on the dashboard.
- **Role Based Access**: Reps (PIN access) and Admins (Email/Password).
- **Notes System**: Timestamped, append-only notes for every lead.
- **Admin CSV Export**: Admins can download all lead data as a CSV file.
- **Responsive**: Mobile-first design works on any device.

## Setup Instructions

### 1. Google Cloud Setup
1.  Go to the [Google Cloud Console](https://console.cloud.google.com/).
2.  Create a new Project and enable the **Google Sheets API**.
3.  Go to "Credentials", create a **Service Account**.
4.  Create a JSON Key for the Service Account and download it.
5.  **Important:** Open your Google Sheet and share it (with "Editor" access) with the `client_email` found in your downloaded JSON key file.

### 2. Google Sheet Schema
Your Google Sheet must have a sheet (tab) named `LEADS` (or whatever you set in `LEADS_SHEET_NAME`). The first row must contain exactly these headers in this order:

`Date`, `LeadName`, `Address`, `ContactNumber`, `Notes`, `Called`, `RenterOwner`, `Superannuation`, `RepName`, `LeadStatus`, `CallTimestamp`, `CallResult`, `LeadID`, `LastUpdated`

### 3. Environment Variables
Create a `.env.local` file in the root of your project:

```bash
# Google Credentials (from your downloaded JSON key file)
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Sheet Config
LEADS_SPREADSHEET_ID="your_google_sheet_id_from_url"
LEADS_SHEET_NAME="LEADS" # Optional, defaults to LEADS

# Admin Auth (for the admin login screen)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="secret123" # Use a strong, non-guessable password
```

### 4. Local Development
Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Vercel Deployment

1.  Push this repository to GitHub/GitLab/Bitbucket.
2.  Import the project into Vercel.
3.  In the Vercel Project Settings, add the same Environment Variables from your `.env.local` file.
    *   **Note:** For `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, copy the entire string including `-----BEGIN PRIVATE KEY-----` and the `\n` characters.
4.  Deploy. Your application will be live.
