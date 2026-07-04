import {Rest, type Endpoint} from '@vdegenne/mini-rest'
import {GeminiTTSModel} from './types.js'
import {VoiceName} from './voice.js'

export interface TTSArgs {
	text: string
	languageCode: string
	model?: GeminiTTSModel
	voice?: VoiceName | 'random'
}

export interface TTSApi {
	get: {ping: Endpoint<void, 'pong'>}
	post: {tts: Endpoint<TTSArgs, void>}
}

let api: Rest<TTSApi> | undefined
export function getApi(): Rest<TTSApi> {
	if (!api) {
		api = new Rest<TTSApi>('http://localhost:37435/')
	}
	return api
}

export function tts(args: TTSArgs) {
	return getApi().post('tts', args)
}
