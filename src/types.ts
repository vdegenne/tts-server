import {type google} from '@google-cloud/text-to-speech/build/protos/protos.js'

/**
 * Better (pricier) to lower quality (cheaper), maybe :
 *
 *	- Instant Custom Voice (voix personnalisée)
 * 	- Studio
 * 	- Gemini 3.1 Flash TTS (preview)
 * 	- Gemini 2.5 Pro TTS
 * 	- Gemini 2.5 Flash TTS
 * 	- Chirp HD (Chirp 3 HD)
 * 	- Neural2
 * 	- WaveNet
 * 	- Standard
 *
 */
export const TTS_MODELS = {
	/**
	 * Gemini 3.1 Flash TTS
	 *
	 * Input : ~1.00 USD / 1M text tokens
	 * Output: ~20.00 USD / 1M audio tokens
	 */
	GEMINI_3_1_FLASH_TTS: 'gemini-3.1-flash-tts-preview',

	/**
	 * Gemini 2.5 Flash TTS
	 *
	 * Input : 0.50 USD / 1M text tokens
	 * Output: 10.00 USD / 1M audio tokens
	 */
	GEMINI_2_5_FLASH_TTS: 'gemini-2.5-flash-tts',
	/**
	 * Gemini 2.5 Flash Lite TTS
	 *
	 * Input : 0.50 USD / 1M text tokens
	 * Output: 10.00 USD / 1M audio tokens
	 */
	GEMINI_2_5_FLASH_LITE_TTS: 'gemini-2.5-flash-lite-preview-tts',

	/**
	 * Gemini 2.5 Pro TTS
	 *
	 * Input : 1.00 USD / 1M text tokens
	 * Output: 20.00 USD / 1M audio tokens
	 */
	GEMINI_2_5_PRO_TTS: 'gemini-2.5-pro-tts',

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
	 * WaveNet
	 *
	 * 0–4M chars/month : FREE
	 * >4M chars/month  : 4.00 USD / 1M chars
	 */
	WAVENET: 'Wavenet',

	/**
	 * Standard
	 *
	 * 0–4M chars/month : FREE
	 * >4M chars/month  : 4.00 USD / 1M chars
	 */
	STANDARD: 'Standard',

	/**
	 * Studio voices
	 *
	 * 0–1M chars/month : FREE
	 * >1M chars/month  : 160.00 USD / 1M chars
	 */
	STUDIO: 'Studio',

	/**
	 * Polyglot
	 *
	 * Pricing not published separately.
	 */
	POLYGLOT: 'Polyglot',
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
