#!/bin/bash

# Firebase 환경 변수 자동 추가 스크립트

echo "NEXT_PUBLIC_FIREBASE_API_KEY" | npx vercel env add NEXT_PUBLIC_FIREBASE_API_KEY production <<< "AIzaSyAFehtzPYQTzXscJPm2-yqKK5GGXKQDIX0"

echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN" | npx vercel env add NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN production <<< "imagefactory-5ccc6.firebaseapp.com"

echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID" | npx vercel env add NEXT_PUBLIC_FIREBASE_PROJECT_ID production <<< "imagefactory-5ccc6"

echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET" | npx vercel env add NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET production <<< "imagefactory-5ccc6.firebasestorage.app"

echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID" | npx vercel env add NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID production <<< "629353944984"

echo "NEXT_PUBLIC_FIREBASE_APP_ID" | npx vercel env add NEXT_PUBLIC_FIREBASE_APP_ID production <<< "1:629353944984:web:9b862385c899063ef2fded"

echo "All environment variables added!"


