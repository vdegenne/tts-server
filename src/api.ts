import {Rest, type Endpoint} from '@vdegenne/mini-rest'
import {AudioManager} from './AudioManager.ts'
import {AudioEncoding, TTSModel} from './types.js'
import {LanguageCode, Voice} from './voice.ts'

export interface TTSArgs {
	/**
	 * The text to feed the TTS service with.
	 */
	text: string
	/**
	 * If not provided, will try to determine the language.
	 * This information is crucial when using a non-gemini model unless
	 * you provide a voice name that matches an existing non-gemini voice.
	 *
	 * @default undefined
	 */
	languageCode?: LanguageCode
	/**
	 * The voice to be used.
	 * TODO: Default to determine
	 */
	voice?: Voice
	/**
	 * The model to be used
	 * TODO: Default to determine
	 */
	model?: TTSModel

	/**
	 * Prompt to be used with the model (only with Gemini models)
	 */
	prompt?: string

	/**
	 * @default MP3
	 */
	audioEncoding?: Exclude<AudioEncoding, 'AUDIO_ENCODING_UNSPECIFIED'>

	/**
	 * @default 0
	 */
	pitch?: number

	/**
	 * @default 1
	 */
	rate?: number
}

export interface TTSApi {
	get: {ping: Endpoint<void, 'pong'>}
	post: {tts: Endpoint<TTSArgs, Blob>}
}

let api: Rest<TTSApi> | undefined
export function getApi(endpoint = 'http://localhost:37435/'): Rest<TTSApi> {
	if (!api) {
		api = new Rest<TTSApi>(endpoint)
	}
	return api
}

let audioManager = new AudioManager()
export function tts(args: TTSArgs) {
	return audioManager.tts(args)
}

export {TTS_MODELS} from './types.js'
export {} from './voices.js'
