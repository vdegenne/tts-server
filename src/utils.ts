import {TTSArgs} from './api.ts'
import {TTSModel} from './types.ts'
import {Voice} from './voice.ts'

async function getHash(input: string | object): Promise<string> {
	const normalized = typeof input === 'string' ? input : JSON.stringify(input)

	const encoder = new TextEncoder()
	const data = encoder.encode(normalized)

	// Node.js path
	if (
		typeof globalThis.process !== 'undefined' &&
		globalThis.process.versions?.node
	) {
		const crypto = await import('node:crypto')
		return crypto.createHash('sha256').update(normalized).digest('hex')
	}

	// Web path
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)

	return Array.from(new Uint8Array(hashBuffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
}

export async function buildTTSHash(args: TTSArgs): Promise<string> {
	return getHash(args)
}

export function isGeminiModel(model: TTSModel) {
	return model.includes('gemini')
}

export function voiceIncludesModel(voice: Voice) {
	return voice.includes('-')
}
