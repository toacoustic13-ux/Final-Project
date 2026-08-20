# Firebase Setup — Final Version

## 1. Create Firebase project
Open Firebase Console and create a project.

## 2. Add a Web App
Project settings → Your apps → Web app → register app.

Copy the Firebase configuration values.

## 3. Create `.env`
Copy `.env.example` to `.env` and fill in the values:

VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

## 4. Enable Authentication
Firebase Console → Authentication → Sign-in method → Email/Password → Enable.

## 5. Create Firestore
Firebase Console → Firestore Database → Create database.

## 6. Security rules
For an assignment/demo, the included `firestore.rules` allows authenticated users to manage student records. For a real production system, use role-based rules.

## 7. Run
npm install
npm run dev

## 8. Test
- Register an account.
- Login.
- Add student.
- View student.
- Edit student.
- Delete student.
- Open Reports.
- Export CSV.
- Open Settings.
- Logout.
