# AI Calculator Bot - Nutrition Tracking with AI

A modern nutrition tracking application powered by AI, featuring food photo analysis, Firebase integration, and Telegram bot support.

## 🚀 Features

- **AI-Powered Food Analysis**: Upload food photos and get instant nutrition information using Google Gemini AI
- **USDA Integration**: Enhanced accuracy with USDA FoodData Central API
- **Firebase Authentication**: Secure user authentication and data storage
- **Nutrition Dashboard**: Track daily calories, protein, carbs, and fats with personalized targets
- **Telegram Bot**: Log meals via Telegram by sending food photos
- **Responsive Design**: Beautiful UI built with Tailwind CSS and shadcn/ui
- **Real-time Updates**: Live nutrition tracking with Firestore

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **AI**: Google Gemini 2.0 Flash
- **Telegram**: Grammy bot framework
- **HTTP Client**: Axios

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Firebase project
- Google AI Studio account (for Gemini API)
- Telegram account (for bot setup, optional)

## 🔧 Installation & Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd ai.calculator.bot
npm install
```

### 2. Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Get your Firebase config from Project Settings > General
5. Create a Firestore composite index:
   - Collection: `nutrition_logs`
   - Fields: `userId` (Ascending), `date` (Descending)

**Important**: We **do not use Firebase Storage**. Images are processed **in-memory only** and are **never saved** to Firestore (no `imageUrl` field).  
If you want to keep a photo for UX (preview/history), we store it **only in the browser** via `localStorage.setItem(\`meal-\${id}\`, base64Image)`.

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini AI Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here
# Get from: https://aistudio.google.com/app/apikey

# Telegram Bot Configuration (Optional)
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
# Get from: https://t.me/botfather

# USDA FoodData Central API (Optional, for enhanced accuracy)
USDA_API_KEY=your_usda_api_key_here
# Get from: https://fdc.nal.usda.gov/api-guide.html
```

### 4. Telegram Bot Setup (Optional)

1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token and add it to `.env.local`
4. After deployment, set webhook:
   ```bash
   curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram/webhook"
   ```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
ai.calculator.bot/
├── app/
│   ├── api/
│   │   ├── nutrition/
│   │   │   └── analyze/        # Nutrition analysis API
│   │   └── telegram/
│   │       └── webhook/        # Telegram webhook endpoint
│   ├── dashboard/              # Dashboard page
│   ├── login/                 # Login page
│   ├── register/              # Registration page
│   ├── scan/                  # Food scanning page
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Homepage
├── components/
│   ├── dashboard/
│   │   └── StatsCard.tsx      # Nutrition stats card component
│   ├── layout/
│   │   ├── NavHeader.tsx      # Navigation header
│   │   ├── LoadingSpinner.tsx # Loading components
│   │   └── ErrorBoundary.tsx  # Error boundary
│   └── ui/                    # shadcn/ui components
├── lib/
│   ├── ai/
│   │   └── gemini.ts          # Gemini AI integration
│   ├── firebase/
│   │   ├── auth.ts            # Firebase authentication
│   │   ├── config.ts          # Firebase configuration
│   │   └── firestore.ts       # Firestore operations
│   ├── nutrition/
│   │   └── usda.ts            # USDA API integration
│   ├── telegram/
│   │   └── bot.ts             # Telegram bot handler
│   └── utils/
│       ├── nutrition.ts       # Nutrition calculations
│       └── utils.ts           # Utility functions
└── types/                     # TypeScript type definitions
```

## 🎯 Usage

### Web Application

1. **Register/Login**: Create an account or sign in
2. **Complete Profile**: Fill in age, gender, height, weight, activity level, and goal
3. **Scan Food**: Upload a photo of your food on the `/scan` page
4. **View Dashboard**: See your daily nutrition totals and progress on `/dashboard`

### Telegram Bot

1. Start the bot: `/start`
2. Send a photo of your food
3. Bot analyzes and displays nutrition info
4. Data is automatically saved to your log

## 🧪 Testing

### Test Gemini Integration

```bash
# Place a test image in project root (test-food.jpg)
npx tsx lib/ai/test-gemini.ts
```

### Test API Endpoint

```bash
curl -X POST http://localhost:3000/api/nutrition/analyze \
  -F "image=@path/to/image.jpg"
```

## 🚢 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Set Telegram Webhook

After deployment, set the webhook URL:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://your-app.vercel.app/api/telegram/webhook"
```

### Firestore Index

Make sure to create the composite index in Firebase Console:
- Collection: `nutrition_logs`
- Fields: `userId` (Ascending), `date` (Descending)

## 🔒 Security Notes

- Never commit `.env.local` to version control
- Use environment variables for all sensitive data
- Enable Firebase security rules for Firestore
- Set up proper CORS policies for production

## 📝 API Endpoints

### POST `/api/nutrition/analyze`

Analyzes a food image and returns nutrition data.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body: `image` (file)

**Response:**
```json
{
  "success": true,
  "data": {
    "foods": [
      {
        "name": "Apple",
        "quantity": "1 medium",
        "calories": 95,
        "protein": 0.5,
        "carbs": 25,
        "fats": 0.3
      }
    ]
  }
}
```

### POST `/api/telegram/webhook`

Telegram webhook endpoint for bot updates.

## 🐛 Troubleshooting

### Firebase Errors

- Ensure Firestore is enabled in Firebase Console
- Check that composite index is created
- Verify environment variables are set correctly

### Gemini API Errors

- Check API key is valid
- Verify quota limits
- Ensure image format is supported (JPEG, PNG)

### Telegram Bot Not Responding

- Verify webhook URL is set correctly
- Check bot token in environment variables
- Ensure webhook endpoint is accessible

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Grammy Documentation](https://grammy.dev/)
- [shadcn/ui Documentation](https://ui.shadcn.com)

## 📄 License

MIT License - feel free to use this project for your own purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using Next.js, Firebase, and Google Gemini AI
# ai.nutrition.tracker
