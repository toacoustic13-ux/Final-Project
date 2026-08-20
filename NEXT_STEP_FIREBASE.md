# Next Step: Firebase

The UI is now ready. To make the system store data permanently:

1. Create a Firebase project.
2. Enable Authentication > Email/Password.
3. Create Firestore Database.
4. Add a `students` collection.
5. Replace the local `students` state with Firestore `onSnapshot/getDocs`.
6. Use `addDoc` for Create.
7. Use `updateDoc` for Update.
8. Use `deleteDoc` for Delete.
9. Add `signInWithEmailAndPassword` for Login.
10. Add role/permission checks for Admin and Normal User.

Do not publish real credentials or insecure Firestore rules.
