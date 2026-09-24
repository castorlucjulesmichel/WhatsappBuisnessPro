# SETUP FIREBASE — Whatssap Business Pro

Aplikasyon an fèt pou yon NOUVO Firebase project.

## 1. Kreye Firebase Project
Firebase Console > Add project.
Bay li yon non tankou:
whatssap-business-pro

Pa itilize Firebase Mystro-Shop oswa MY-Investissements.

## 2. Ajoute Web App
Project settings > Your apps > Web > Add app.

Kopi config la epi mete li nan:
firebase-config.js

Ranplase:
YOUR_API_KEY
YOUR_PROJECT
YOUR_PROJECT_ID
YOUR_SENDER_ID
YOUR_APP_ID

## 3. Phone Authentication
Authentication > Sign-in method > Phone > Enable.

Nan Authentication > Settings > Authorized domains:
ajoute domèn GitHub Pages aplikasyon sa a lè li pibliye.

OTP sou entènèt itilize Firebase reCAPTCHA.

## 4. Firestore
Build > Firestore Database > Create database.

Apre sa:
Firestore > Rules
kopi tout kontni firestore.rules nan repo a
epi Publish.

## 5. Storage
Build > Storage > Get started.

Storage > Rules
kopi tout kontni storage.rules nan repo a
epi Publish.

## 6. Kreye premye kont Admin
1. Konekte yon fwa nan aplikasyon an ak nimewo telefòn ki dwe admin.
2. Firebase Console > Authentication > Users.
3. Kopi UID itilizatè sa a.
4. Firestore > Start collection.
5. Collection ID:
   admins
6. Document ID:
   kole UID admin lan.
7. Ajoute field:
   active = true   (Boolean)
   name = non admin lan (String, opsyonèl)

Pa bay itilizatè nòmal aksè ekri nan collection admins.
Rules repo a bloke ekriti client sou admins.

Apre sa louvri:
admin.html
ak menm kont la.

## 7. Collections aplikasyon an
Yo kreye otomatikman pandan itilizasyon:
users
publicProfiles
businesses
userSettings
chats
supportThreads
statuses
products
orders
shortVideos
financialRequests
exchangeRequests
walletTransactions
investmentLevels
investments
adTopups
adCampaigns
notifications
moderationCases

admins dwe kreye manyèlman pou premye admin lan.

## 8. MonCash / NatCash Boost
Kounye a:
- kliyan chwazi MonCash oswa NatCash
- antre montan HTG/USD
- antre referans
- upload prèv
- admin valide
- Ad Wallet ogmante

Sa PA vle di API MonCash/NatCash merchant otomatik deja konekte.
Pou peman otomatik:
- backend sekirize obligatwa
- merchant credentials obligatwa
- webhook server-side obligatwa
- pa mete secret/API private key nan GitHub public oswa JavaScript frontend.

## 9. Admin ak mesaj prive
Admin ka li:
- chat sipò Admin ↔ itilizatè
- ekstrè chat yon itilizatè chwazi pataje/rapòte pou moderasyon

Admin pa jwenn aksè otomatik nan tout chat prive yo.

## 10. Piblikasyon
Repo:
castorlucjulesmichel/WhatsappBuisnessPro

Apre Firebase config ak rules yo pare, app la ka pibliye sou GitHub Pages.
