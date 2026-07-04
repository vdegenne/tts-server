import fs from 'fs'
import {ttsClient} from '../src/tts-client.ts'

async function fetchVoices() {
	const data = await ttsClient.listVoices()
	return data[0].voices ?? []
}

function isAliasName(name: string): boolean {
	return name.split('-').length === 1
}

function extractVoices(voices: any[]): string[] {
	return Array.from(new Set(voices.map((v) => v.name))).sort()
}

function extractAliases(voices: any[]): string[] {
	const set = new Set<string>()

	for (const v of voices) {
		if (isAliasName(v.name)) {
			set.add(v.name)
		}
	}

	return Array.from(set).sort()
}

function extractLanguageCodes(voices: any[]): string[] {
	const set = new Set<string>()

	for (const v of voices) {
		const parts = v.name.split('-')
		if (parts.length >= 2) {
			set.add(`${parts[0]}-${parts[1]}`)
		}
	}

	return Array.from(set).sort()
}

function generateArray(name: string, values: string[]): string {
	const lines: string[] = []

	lines.push(`export const ${name} = [`)
	for (const v of values) {
		lines.push(`  "${v}",`)
	}
	lines.push(`] as const;`)

	lines.push(
		`export type ${
			name === 'VOICES'
				? 'Voice'
				: name === 'VOICE_ALIASES'
					? 'VoiceAlias'
					: 'LanguageCode'
		} = typeof ${name}[number];`,
	)

	lines.push('\n')

	return lines.join('\n')
}

async function main() {
	const voicesRaw = await fetchVoices()

	const voices = extractVoices(voicesRaw)
	const aliases = extractAliases(voicesRaw)
	const languages = extractLanguageCodes(voicesRaw)

	const ts =
		generateArray('VOICES', voices) +
		generateArray('VOICE_ALIASES', aliases) +
		generateArray('LANGUAGE_CODES', languages)

	fs.writeFileSync('./src/voice.ts', ts, 'utf-8')

	console.log('Generated voice.ts')
	console.log(`  VOICES: ${voices.length}`)
	console.log(`  VOICE_ALIASES: ${aliases.length}`)
	console.log(`  LANGUAGE_CODES: ${languages.length}`)
}

main().catch(console.error)
