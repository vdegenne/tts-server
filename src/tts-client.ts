import {TextToSpeechClient} from '@google-cloud/text-to-speech'
import {GoogleAuth} from 'google-auth-library'
// import dotenv from './dotenv.ts'
// dotenv.config()
// console.log(process.env.GOOGLE_TTS_API_KEY)

const auth = new GoogleAuth({
	// apiKey: process.env.GOOGLE_TTS_API_KEY,
	/**
	 * The service account file was generated in google cloud
	 */
	keyFilename: './service-account.json',
	scopes: 'https://www.googleapis.com/auth/cloud-platform',
})
export const ttsClient = new TextToSpeechClient({
	// apiKey: process.env.GOOGLE_TTS_API_KEY,
	keyFilename: './service-account.json',
	auth,
})
