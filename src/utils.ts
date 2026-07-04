import crypto from 'crypto'
import {TTSArgs} from './api.ts'
import {TTSModel} from './types.ts'
import {Voice} from './voice.ts'

function getHash(input: string | object): string {
	const normalized = typeof input === 'string' ? input : JSON.stringify(input)
	console.log('normalized: ', normalized)

	return crypto.createHash('sha256').update(normalized).digest('hex')
}

export function buildTTSHash(
	args: TTSArgs,
	// 	{
	// 	text: string
	// 	voice: string
	// 	speed: number
	// 	pitch: number
	// 	audioEncoding: string
	// 	languageCode: LanguageCode
	// 	model: TTSModel
	// }
): string {
	return getHash(args)
}

export function isGeminiModel(model: TTSModel) {
	return model.includes('gemini')
}

export function voiceIncludesModel(voice: Voice) {
	return voice.includes('-')
}
