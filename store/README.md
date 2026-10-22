# Google Play submission kit

## Listing text
`listing/<locale>/{title,short,full}.txt` — copy-paste into Play Console > Grow > Store presence > Main store listing (add each language under "Manage translations"). Limits: title 30, short 80, full 4000 characters; all files are within limits.

Locales: en-US (default), ru-RU, he-IL, es-419, pt-BR, ar, hi-IN, id.

Keywords woven into the text (Play indexes title, short and full description): WhatsApp without saving number, chat without adding contact, direct chat, international phone number, extract number from text, unsaved number, country code, paste.

Policy reminders: no "#1/best" claims, no emoji spam, no keyword stuffing, and the independence disclaimer stays in every language.

## Privacy policy
`privacy-policy.html` — replace `CONTACT_EMAIL`, host it at a public HTTPS URL, and paste that URL in Play Console > App content > Privacy policy.

## Data safety form (answers matching the current app)
- Does the app collect or share user data? **No**
- Is data encrypted in transit? n/a (no data transmitted)
- Can users request deletion? n/a (all data is local; clearing app data deletes it)
- Clipboard is read only on a user tap and never leaves the device.

## App content declarations
- Ads: **No**
- Target audience: 18+ (or 13+); not designed for children
- Content rating questionnaire: utility app, no user-generated content, no violence/sexual content
- App category: Tools (or Communication)
- News / government / health / financial features: none

## Still needed from you
- Developer account (one-time $25) and identity verification
- Contact email for the policy and store listing
- Store graphics: icon 512x512 (have `icon-512.png`), feature graphic 1024x500, at least 2 phone screenshots (8 per locale is better)
- Personal accounts created after Nov 2023: closed test with 12+ testers for 14 days before production access

## Release file
`android/app/build/outputs/bundle/release/app-release.aab` (rebuild: `npm run build && npx cap sync android && cd android && ./gradlew bundleRelease`, JAVA_HOME = Android Studio's `jbr`).
Enable Play App Signing when prompted; keep the upload keystore backed up.
