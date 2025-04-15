
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
![Screenshot](https://private-user-images.githubusercontent.com/82361434/433629009-584af038-4381-48ae-8e77-f4b5ad497371.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ2ODM2MzUsIm5iZiI6MTc0NDY4MzMzNSwicGF0aCI6Ii84MjM2MTQzNC80MzM2MjkwMDktNTg0YWYwMzgtNDM4MS00OGFlLThlNzctZjRiNWFkNDk3MzcxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA0MTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwNDE1VDAyMTUzNVomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPWVkZTc1Mzg3MDg3MTNlYzMwOTc3NTBjMGQ0ZTE2MTkwZDE1ZWM5YjIzZDIyMTNmY2JlZWY1MjUwYjYxZDkxMmEmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.AIFWFqb_fpLFfyYiT43xMLXz1xDlNaKyHtmHM5fSfWs)

![Image](https://private-user-images.githubusercontent.com/82361434/433629547-b61a7799-d6be-4638-ae1d-d82ff6f76571.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ2ODM3ODgsIm5iZiI6MTc0NDY4MzQ4OCwicGF0aCI6Ii84MjM2MTQzNC80MzM2Mjk1NDctYjYxYTc3OTktZDZiZS00NjM4LWFlMWQtZDgyZmY2Zjc2NTcxLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA0MTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwNDE1VDAyMTgwOFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTc0YjM2YjNiOTJmMTQzNTczOWM1ZDY5NGQ1MjJmMTM1ZTM2YTg5NDI3ZGU3M2EzOWU0MDc4MDNhYzE5NzhlOGYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.jUctky67-jVaZbHJc8BphoxYCwA2V5tQgqBP5PQK348)

![ScreenShot](https://private-user-images.githubusercontent.com/82361434/433630161-c024e069-2bbd-4a0b-af15-060456d037ea.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ2ODM5NTgsIm5iZiI6MTc0NDY4MzY1OCwicGF0aCI6Ii84MjM2MTQzNC80MzM2MzAxNjEtYzAyNGUwNjktMmJiZC00YTBiLWFmMTUtMDYwNDU2ZDAzN2VhLnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA0MTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwNDE1VDAyMjA1OFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPTU0YTM3NTJjYTgzYmRhZjA2MTMxY2Y5ZDRhNmMyMTY2MjViNTNjMDlhZjQ1ZGRiMzdmZmM4YWE2NDI2M2E4ZDkmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.evmx2jON4GvOBUyn3rksQXl-xMssmxqMQb9CsWKgrlg)

![ScreenShot](https://private-user-images.githubusercontent.com/82361434/433630413-055e81d7-cf98-4133-ae8a-ffa2fb164b14.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ2ODQwMjAsIm5iZiI6MTc0NDY4MzcyMCwicGF0aCI6Ii84MjM2MTQzNC80MzM2MzA0MTMtMDU1ZTgxZDctY2Y5OC00MTMzLWFlOGEtZmZhMmZiMTY0YjE0LnBuZz9YLUFtei1BbGdvcml0aG09QVdTNC1ITUFDLVNIQTI1NiZYLUFtei1DcmVkZW50aWFsPUFLSUFWQ09EWUxTQTUzUFFLNFpBJTJGMjAyNTA0MTUlMkZ1cy1lYXN0LTElMkZzMyUyRmF3czRfcmVxdWVzdCZYLUFtei1EYXRlPTIwMjUwNDE1VDAyMjIwMFomWC1BbXotRXhwaXJlcz0zMDAmWC1BbXotU2lnbmF0dXJlPThlNjQ5ZGYxN2I4NTc3ODBiNmU1OTdlNmM0Y2M0M2E2ODdlYjZmMjQ4NzM3OGE0NWUyNjk2MGFlZjI3N2UyMTYmWC1BbXotU2lnbmVkSGVhZGVycz1ob3N0In0.KKLVGVujfNsfvrcwYQTwv39lbdExNIutrlWleGcWodg)


### Video Demo
[View Demo](https://www.loom.com/share/bba30c7b468942be938979f02c6684a8?sid=0bfaa500-f9aa-48a4-92d8-177378401f45)

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
