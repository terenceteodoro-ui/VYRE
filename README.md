# VYRE — Private by Design.
## Setup
1. console.firebase.google.com > Add project. Build > Authentication > Get started > enable **Email/Password** and **Google**.
2. Build > Firestore Database > Create (production mode). Build > Storage > Get started.
3. Project settings > Your apps > Web (`</>`) > copy the config into `firebase-config.js`.
4. `npm i -g firebase-tools && firebase login && firebase init` (pick existing project; keep the existing rules files) then `firebase deploy --only firestore:rules,storage`.
5. Run locally: `firebase serve` (or `npx serve .`). Add `localhost` under Authentication > Settings > Authorized domains if needed.
6. Deploy: `firebase deploy --only hosting`.
## Data model
usernames/{name}{uid} · users/{uid} · connections/{uidA_uidB}{users,requester,status} · conversations/{connId}{members,lastMessage,updatedAt}/messages/{id}{senderId,text,createdAt}
## Security note
Rules enforce access control (membership, ownership, accepted connection). This is NOT end-to-end encryption; Firebase can read stored messages.
## Not built yet
Groups, file/image attachments, edit/reactions/replies, read receipts, typing/presence, blocking, FCM notifications, privacy settings, PWA manifest/service worker, account deletion, message search.
