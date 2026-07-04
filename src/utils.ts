import crypto from 'crypto'

function getHash(input: string | object): string {
	const normalized = typeof input === 'string' ? input : JSON.stringify(input)

	return crypto.createHash('sha256').update(normalized).digest('hex')
}

export function buildTTSHash(input: {
	text: string
	model: string
	voice?: string
	speed?: number
	pitch?: number
	format?: string
}) {
	return getHash({
		text: input.text,
		model: input.model,
		voice: input.voice ?? 'default',
		speed: input.speed ?? 1,
		pitch: input.pitch ?? 0,
		format: input.format ?? 'mp3',
	})
}
