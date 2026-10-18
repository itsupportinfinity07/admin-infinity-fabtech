// Usage: npm run create-admin -- you@example.com 'a-long-password'
import { init } from "./env";

const [email, password] = process.argv.slice(2);
if (!email || !password || password.length < 8) {
  console.error("Usage: npm run create-admin -- <email> <password (8+ chars)>");
  process.exit(1);
}
const { auth, db } = init();

(async () => {
  let uid: string;
  try {
    uid = (await auth.getUserByEmail(email)).uid;
    await auth.updateUser(uid, { password });
    console.log("Existing user found: password updated.");
  } catch {
    uid = (await auth.createUser({ email, password })).uid;
    console.log("User created.");
  }
  await auth.setCustomUserClaims(uid, { role: "admin" });
  await db.collection("users").doc(uid).set({ email, role: "admin" });
  console.log(`${email} is now an admin. Sign in at /login.`);
})();
