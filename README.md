
# 🧠 MailMind – Smart Inbox, Zero Noise

The intelligent backend that connects multiple Gmail accounts, classifies emails using Gemini AI, and delivers a real-time, organized inbox with minimal user input.

🚨 Why MailMind Exists
Inboxes today are digital war zones:

- Hundreds of emails flood in daily — most of it noise.
- Important messages get buried under promos, updates, spam.
- Managing multiple Gmail accounts is tedious and overwhelming.
- Even with labels and tabs, users are forced to manually clean and categorize.
- MailMind does all of that for you. Automatically. In real-time.

## 🧠 What MailMind Does
- Connect multiple Gmail accounts seamlessly via OAuth2
-  Classify emails using Gemini AI – Promotions, Social, Personal, etc.
- AI-Powered Summarization of Email
- Zero-lag access with Redis for instant inbox loading
- Background job queues via BullMQ for async fetching + processing
- Real-time updates to frontend using WebSockets

## ScreenShot
![Screenshot](https://i.imgur.com/mYR84Od.png)

![ScreenShot](https://i.imgur.com/NJKZyNH.png)

![ScreenShot](https://i.imgur.com/RrgsG78.png)

![ScreenShot](https://i.imgur.com/TFUfnZO.png)

### Video Demo
[View Demo](https://youtu.be/4PCUY1yUOOg)

## 📸 System Flow
### 🧱 Key Architectural Highlights
- Redis – Fast, In-Memory Storage{
    - Stores access + refresh tokens per Gmail account.
    - Stores categorized emails.
    - Caching prevents re-fetching or duplicate classification.
}

-  BullMQ – Robust Background Jobs{
    - Pulls latest emails from Gmail
    - Feeds email subject/body into Gemini AI
    - Saves categorized result to Redis
    - Notifies frontend via WebSocket
    ** All jobs retry on failure, are isolated, and scale independently.**
}
-  WebSockets – Real-Time Sync
-  Background Scheduler{
    - Round-robin job
    - Cycles through users + accounts
    - Automatically queues up fetch + classify jobs
    - No user interaction required → Fully autonomous inbox hygiene
}

##  What’s Next
- Add multiple Email Providers
- Delete and Send support
- Unified inbox 

## Getting Started (Dev)
git clone https://github.com/your-username/mailmind-backend.git

cd mailmind-backend

npm install

cp .env  --example .env

Fill in the environment variables like:
 - MONGO_URI
 - REDIS_URL
 - GMAIL_CLIENT_ID
 - GMAIL_CLIENT_SECRET
 - GEMINI_API_KEY

 npm run dev
