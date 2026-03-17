import admin from 'firebase-admin'
import { getFirestore } from 'firebase-admin/firestore'

let app: admin.app.App | null = null

export function getFirebaseApp(): admin.app.App {
  if (app) return app

  // Cloud Run / GCP: uses attached service account automatically.
  // Local dev: set GOOGLE_APPLICATION_CREDENTIALS to a service account json.
  app = admin.initializeApp({
    credential: admin.credential.applicationDefault(),
  })

  return app
}

export function getDb() {
  const firebaseApp = getFirebaseApp()
  // 
  const databaseId = process.env.FIRESTORE_DATABASE_ID || '(default)'
  return getFirestore(firebaseApp, databaseId)
}

