import {Rest, type Endpoint} from '@vdegenne/mini-rest'

type TTSArgs = {text: string}
export interface ttsApi {
	get: {ping: Endpoint<void, 'pong'>}
	post: {tts: Endpoint<TTSArgs, void>}
}

let api: Rest<ttsApi> | undefined
export function getApi(): Rest<ttsApi> {
	if (!api) {
		api = new Rest<ttsApi>('http://localhost:37435/api')
	}
	return api
}

export function tts(args: TTSArgs) {
	return getApi().post('tts', args)
}
