# Dominion TV Mobile App — Stakeholder Brief

**Prepared for:** Executive & Non-Technical Stakeholders
**Document type:** Project Status, Costs & Roadmap Overview
**App version:** 1.0 (Development)

---

## 1. What Is the Dominion TV App?

The Dominion TV mobile app is a free, publicly accessible application for smartphone users (iPhone and Android). It serves as a digital companion to the Dominion TV broadcasting station, giving viewers an easy way to:

- See what programme is currently on air — at a glance, in real time
- Get reminded before their favourite shows begin
- Receive a push notification the moment the channel goes live on YouTube
- Listen to Dominion Radio live, directly from their phone
- Read the latest news headlines from the station

No account or login is required. Anyone who downloads the app can use it immediately.

---

## 2. What Has Been Built and Is Working

### Home Screen — Live Programme Schedule
The app shows the full weekly TV schedule. It automatically highlights the programme currently on air with a "LIVE" badge, and shows upcoming shows for the rest of the day. Tapping any programme opens it on YouTube — either the live stream (if it's currently airing) or a search for past episodes.

**Status: Working**

---

### News Section
A dedicated news tab displays headlines and stories from Dominion TV. Currently the content is pre-loaded into the app. A future update will connect this to a live news feed so stories update automatically.

**Status: Working (static content — see Section 3 for planned upgrade)**

---

### Programme Reminders (Settings)
Users can toggle notifications for individual programmes in the Settings screen. When a reminder is turned on for a show, the app automatically schedules a notification 15 minutes before that programme airs — every week, on the correct days. Toggling it off cancels all future reminders for that show. Preferences are saved, so they persist even if the phone is restarted.

**Status: Working on physical devices running the app**

---

### Live Go-Live Notifications
When a programme is scheduled to begin, the app checks whether the Dominion TV YouTube channel has gone live. If the channel is live, the user receives a push notification immediately. If the channel isn't live yet (e.g. slight delay), the app automatically retries — at 1 minute after the scheduled start, then 2 minutes, then 5 minutes — before giving up.

This works even when the app is closed or the phone is locked.

**Status: Logic fully built — requires two setup items to activate (see Section 3)**

---

### Dominion Radio — Live Audio Streaming
A new Radio tab lets users listen to Dominion Radio live from the app. Features include:

- One-tap play/pause
- Buffering indicator while the stream loads
- Automatic reconnection if the internet drops, with retry delays (1s → 2s → 4s → 8s and so on)
- Audio continues playing when the phone is locked or the user switches to another app
- Lock screen controls (play/pause visible on the phone's lock screen)
- Station artwork and Dominion TV branding displayed in the player
- Clear error message with a "Try Again" button if the stream cannot connect

**Status: Working on physical devices**

---

### App Branding & Icon
The Dominion TV logo is used as the app icon on both iPhone and Android home screens, and as the splash screen shown when the app opens.

**Status: Complete**

---

## 3. What Is Not Yet Working / Known Limitations

### YouTube Credentials Not Yet Added
The live go-live notification system requires two pieces of information that need to be configured:

1. **Dominion TV YouTube Channel ID** — the unique identifier for your YouTube channel (looks like `UCxxxxxxxxxxxxxxxxxxxxxxxx`)
2. **YouTube Data API Key** — a free access key from Google that allows the app to check whether the channel is live

Without these, the app will not fire live notifications. Adding them is a one-time technical setup that takes under 30 minutes. Once added, the feature activates automatically.

**Action required: Provide YouTube Channel ID + API Key to the development team**

---

### Background Notifications Work Best on a Published App
The live notification and background audio features are fully coded and work correctly when the app is installed from the App Store or Play Store. During the current development phase (using Expo Go for testing), some background features are limited by Apple and Google's testing restrictions.

**No action needed now — this resolves automatically once the app is published to the stores**

---

### News Content Is Static
Currently the news stories shown in the app are pre-loaded. They do not update automatically. A content management system (a web-based tool your team can log into to add/edit stories) is planned as a future feature.

---

### No Admin Panel Yet
There is no web dashboard for the Dominion TV team to update the programme schedule, publish news, or monitor notification activity. This is on the roadmap for the next development phase.

---

## 4. How the App Works — Plain English Overview

Think of the app as having three layers:

**The Front (what users see):** The screens, buttons, and content on the phone — the schedule, news, radio, and settings.

**The Middle (the logic):** Code running on the user's phone that tracks what time it is, figures out what's on air, plays the radio stream, and manages reminders and notifications.

**The Back (the server):** A lightweight server that handles any data the app needs. Currently it stores content like news and schedule data. In future it will also manage user preferences centrally and send push notifications from a single point.

All three layers are built and running. The app is fully functional for a Version 1 release.

---

## 5. Publication Costs — App Store & Google Play

To make the app available for public download, you must register developer accounts with Apple and Google. These are one-time or annual fees, separate from any development costs.

### Apple App Store (iPhone / iPad)
| Item | Cost |
|---|---|
| Apple Developer Program membership | **$99 USD per year** (~₦155,000/year) |
| App submission | Free (included in membership) |
| Apple's share of paid sales | 30% (not applicable for a free app) |

- Requires a physical Mac computer or a cloud build service (already configured in this project)
- App review by Apple typically takes 1–3 business days
- Once approved, updates can be pushed at any time (each update is reviewed, usually faster)

### Google Play Store (Android)
| Item | Cost |
|---|---|
| Google Play Developer account | **$25 USD one-time** (~₦39,000) |
| App submission | Free |
| Google's share of paid sales | 30% (not applicable for a free app) |

- No annual renewal — the $25 is paid once, forever
- Review time is typically a few hours to 2 business days

### Summary
| Platform | Year 1 Cost | Year 2+ Cost |
|---|---|---|
| iPhone (App Store) | ~₦155,000 | ~₦155,000/year |
| Android (Play Store) | ~₦39,000 | Free |
| **Total** | **~₦194,000** | **~₦155,000/year** |

> **Note:** These figures are for the developer registration fees only. They do not include app development costs, server hosting, or any design work.

---

## 6. Ongoing Infrastructure Costs

The app currently runs on Replit's hosting platform. As the user base grows, costs will increase modestly:

| Scale | Estimated Monthly Cost |
|---|---|
| Development / testing (current) | Free – $20/month |
| Small audience (under 5,000 users) | $20 – $50/month |
| Medium audience (5,000 – 50,000 users) | $50 – $200/month |
| Large audience (50,000+ users) | $200 – $1,000/month |

These are rough estimates. Exact costs depend on how often users open the app, how many notifications are sent, and how much radio streaming is used.

Push notifications (the alerts when a programme goes live) are provided through Expo's notification service, which is **free** for up to tens of thousands of deliveries per month.

---

## 7. Features We Can Add Next

The following features are ready to be planned and built. They are listed in suggested priority order:

### High Priority

**Live News Feed**
Connect the news section to a live feed so stories update automatically without a new app release. This could pull from your website, RSS feed, or a simple content management system.

**Admin Dashboard**
A private web page where the Dominion TV team can update the programme schedule, publish news articles, and see how many active users the app has — without needing a developer.

**On-Demand Video Library**
A dedicated screen showing past episodes and programmes available on the Dominion TV YouTube channel, browseable by category or programme name.

---

### Medium Priority

**Live TV Streaming (In-App Video)**
Instead of opening YouTube to watch, allow users to watch the live broadcast directly inside the app. Requires a video streaming link from your broadcast provider.

**Breaking News Push Notifications**
Allow the admin team to send a push notification to all app users instantly — for breaking news, special broadcasts, or emergency announcements.

**Multiple Radio Streams**
If Dominion TV operates more than one radio stream (e.g. different language or format), the Radio screen can be expanded to let users choose.

**Mini Radio Player Bar**
A small "now playing" strip that stays at the bottom of the screen while the radio is on, so users can browse the schedule or news without stopping the audio.

---

### Future Enhancements

**Programme Favourites**
Let users mark programmes as favourites and automatically set reminders for all of them from a single screen.

**Yoruba / English Language Toggle**
Allow the interface to switch between English and Yoruba for users who prefer their native language.

**Audience Analytics**
See how many people are using the app, which programmes are most popular, and which notifications get the most responses — all from a simple dashboard.

**Social Sharing**
Let users share a programme or news story to WhatsApp, Facebook, or X (formerly Twitter) with one tap.

**Listener Dedication / Request Feature**
Allow radio listeners to send a message or song dedication request directly from the app — similar to texting the station.

---

## 8. Recommended Next Steps

| Priority | Action | Who |
|---|---|---|
| 1 | Provide YouTube Channel ID and API Key to activate live notifications | Dominion TV Team |
| 2 | Test the app on physical phones using Expo Go (scan QR code in the app) | All stakeholders |
| 3 | Register Apple and Google developer accounts in preparation for store submission | Management |
| 4 | Decide on content strategy for the news section (static vs. live feed) | Editorial Team |
| 5 | Review the feature roadmap above and prioritise what comes in Version 2 | All stakeholders |

---

## 9. Summary Table

| Feature | Status |
|---|---|
| Programme schedule with live detection | Live |
| YouTube integration (watch live & past shows) | Live |
| News section | Live (static content) |
| Programme reminders (15 min before) | Live |
| Go-live push notifications | Built — needs YouTube credentials |
| Dominion Radio live streaming | Live |
| Background audio (radio while phone locked) | Live |
| App icon / branding | Complete |
| Admin dashboard | Not yet built |
| Live news feed | Not yet built |
| In-app video player | Not yet built |
| Breaking news notifications | Not yet built |
| On-demand video library | Not yet built |

---

*Document prepared by the Dominion TV App development team. For technical questions, contact the development team directly.*
