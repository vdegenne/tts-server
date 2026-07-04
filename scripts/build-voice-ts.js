import fs from 'fs'
import {ttsClient} from '../src/tts-client.ts'

async function fetchVoices() {
	const data = await ttsClient.listVoices()
	return data[0].voices
}

function isAliasName(name) {
	// plain voices like "Achernar"
	// reject full structured ones like "ja-JP-Chirp3-HD-Achernar"
	return !name.includes('-')
}

function extractAliases(voices) {
	const set = new Set()

	for (const v of voices) {
		if (isAliasName(v.name)) {
			set.add(v.name)
		}
	}

	return Array.from(set).sort()
}

function generateTS(voices, aliases) {
	const lines = []

	// FULL voice names
	lines.push('export type VoiceName =')
	voices.forEach((v, i) => {
		lines.push(`  | "${v.name}"${i === voices.length - 1 ? ';' : ''}`)
	})

	lines.push('')

	// alias type
	lines.push('export type VoiceAlias =')
	aliases.forEach((a, i) => {
		lines.push(`  | "${a}"${i === aliases.length - 1 ? ';' : ''}`)
	})

	lines.push('')

	// alias array
	lines.push('export const VOICE_ALIASES = [')
	aliases.forEach((a) => {
		lines.push(`  "${a}",`)
	})
	lines.push('] as const;')

	lines.push('')
	lines.push('export interface Voice {')
	lines.push('  name: VoiceName;')
	lines.push('  languageCodes: string[];')
	lines.push("  ssmlGender: 'MALE' | 'FEMALE' | 'NEUTRAL';")
	lines.push('  naturalSampleRateHertz: number;')
	lines.push('}')

	return lines.join('\n')
}

async function main() {
	const voices = await fetchVoices()
	const aliases = extractAliases(voices)

	const ts = generateTS(voices, aliases)

	fs.writeFileSync('./src/voice.ts', ts, 'utf-8')

	console.log(
		`Generated voice.ts with ${voices.length} voices and ${aliases.length} aliases`,
	)
}

main().catch(console.error)
