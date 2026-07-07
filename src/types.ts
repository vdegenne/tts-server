import {type google} from '@google-cloud/text-to-speech/build/protos/protos.js'

/**
 * Gemini models has no free quota !
 * They are way more expensive than recent and old models.
 * Also you will have to activate the "Agent Plateform" API on Google Cloud to use them.
 *
 * The Non-Gemini models are sort from priciest to cheapest in the structure.
 * Though they have different FREE quota, so you might want to study the list before choosing one.
 *
 * Basically it goes like this (from cheapest to priciest):
 *	- Standard/WaveNet
 *	- Neural2/Polyglot
 *	- Chirp3-HD
 *	- Studio
 */
export const TTS_MODELS = {
	/**
	 * Gemini 3.1 Flash TTS
	 *
	 * NO FREE quota
	 * Input : 1.00 USD / 1M text tokens
	 * Output: 20.00 USD / 1M audio tokens(*)
	 *
	 * (*) Audio tokens correspond to 25 tokens per second of audio
	 */
	GEMINI_3_1_FLASH_TTS: 'gemini-3.1-flash-tts-preview',

	/**
	 * Gemini 2.5 Pro TTS
	 *
	 * Input : 1.00 USD / 1M text tokens
	 * Output: 20.00 USD / 1M audio tokens(*)
	 *
	 * (*) Audio tokens correspond to 25 tokens per second of audio
	 */
	GEMINI_2_5_PRO_TTS: 'gemini-2.5-pro-tts',

	/**
	 * Gemini 2.5 Flash TTS
	 *
	 * NO FREE quota
	 * Input : 0.50 USD / 1M text tokens
	 * Output: 10.00 USD / 1M audio tokens(*)
	 *
	 * (*) Audio tokens correspond to 25 tokens per second of audio
	 */
	GEMINI_2_5_FLASH_TTS: 'gemini-2.5-flash-tts',
	/**
	 * Gemini 2.5 Flash Lite TTS
	 *
	 * NO FREE quota
	 * Input : 0.50 USD / 1M text tokens
	 * Output: 10.00 USD / 1M audio tokens(*)
	 *
	 * (*) Audio tokens correspond to 25 tokens per second of audio
	 */
	GEMINI_2_5_FLASH_LITE_TTS: 'gemini-2.5-flash-lite-preview-tts',

	/**
	 * Studio voices
	 *
	 * 0–1M chars/month : FREE
	 * >1M chars/month  : 160.00 USD / 1M chars
	 */
	STUDIO: 'Studio',

	/**
	 * Chirp 3 HD
	 *
	 * 0–1M chars/month : FREE
	 * >1M chars/month  : 30.00 USD / 1M chars
	 */
	CHIRP_3_HD: 'Chirp3-HD',
	/**
	 * Chirp HD
	 *
	 * Legacy model.
	 * Pricing not published separately.
	 * Same as Chirp3-HD ?
	 */
	CHIRP_HD: 'Chirp-HD',

	/**
	 * Neural2
	 *
	 * 0–1M chars/month : FREE
	 * >1M chars/month  : 16.00 USD / 1M chars
	 *
	 */
	NEURAL_2: 'Neural2',
	/**
	 * Polyglot
	 *
	 * 0–1M chars/month : FREE
	 * >1M chars/month  : 16.00 USD / 1M chars
	 */
	POLYGLOT: 'Polyglot',

	/**
	 * WaveNet
	 *
	 * 0–4M chars/month : FREE
	 * >4M chars/month  : 4.00 USD / 1M chars
	 *
	 * 👍
	 * Note: Historically better than "Standard"
	 * but its price became the same.
	 */
	WAVENET: 'Wavenet',

	/**
	 * Standard
	 *
	 * 0–4M chars/month : FREE
	 * >4M chars/month  : 4.00 USD / 1M chars
	 *
	 */
	STANDARD: 'Standard',
} as const

export type TTSModel = (typeof TTS_MODELS)[keyof typeof TTS_MODELS]

export type AudioEncoding =
	keyof typeof google.cloud.texttospeech.v1.AudioEncoding

export const audioEncodingToExtension: Record<AudioEncoding, string> = {
	AUDIO_ENCODING_UNSPECIFIED: '',
	LINEAR16: 'wav',
	MP3: 'mp3',
	OGG_OPUS: 'ogg',
	MULAW: 'wav',
	ALAW: 'wav',
	PCM: 'wav',
	M4A: 'm4a',
}

export const audioEncodingToMimeType: Record<AudioEncoding, string> = {
	AUDIO_ENCODING_UNSPECIFIED: 'application/octet-stream',
	LINEAR16: 'audio/wav',
	MP3: 'audio/mpeg',
	OGG_OPUS: 'audio/ogg',
	MULAW: 'audio/wav',
	ALAW: 'audio/wav',
	PCM: 'audio/wav',
	M4A: 'audio/mp4',
}
