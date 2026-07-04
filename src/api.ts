import {Rest, type Endpoint} from '@vdegenne/mini-rest'

export const GEMINI_TTS_MODELS = {
	GEMINI_3_1_FLASH_TTS: 'gemini-3.1-flash-tts-preview',
	GEMINI_2_5_FLASH_TTS: 'gemini-2.5-flash-tts',
	GEMINI_2_5_PRO_TTS: 'gemini-2.5-pro-tts',
	GEMINI_2_5_FLASH_LITE_TTS: 'gemini-2.5-flash-lite-preview-tts',
	CHIRP_3_HD_VOICES: 'chirp-3-hd-voices',
} as const

type GeminiTTSModel = (typeof GEMINI_TTS_MODELS)[keyof typeof GEMINI_TTS_MODELS]

type TTSArgs = {text: string; model: GeminiTTSModel}

export interface ttsApi {
	get: {ping: Endpoint<void, 'pong'>}
	post: {tts: Endpoint<TTSArgs, void>}
}

let api: Rest<ttsApi> | undefined
export function getApi(): Rest<ttsApi> {
	if (!api) {
		api = new Rest<ttsApi>('http://localhost:37435/')
	}
	return api
}

export function tts(args: TTSArgs) {
	return getApi().post('tts', args)
}
