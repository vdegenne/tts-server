import fs from 'fs'

function config() {
	const content = fs.readFileSync('.env', 'utf-8')

	for (const line of content.split('\n')) {
		const trimmed = line.trim()

		if (!trimmed || trimmed.startsWith('#')) continue

		const eqIndex = trimmed.indexOf('=')
		if (eqIndex === -1) continue

		const key = trimmed.slice(0, eqIndex)
		let value = trimmed.slice(eqIndex + 1)

		if (
			(value.startsWith('"') && value.endsWith('"')) ||
			(value.startsWith("'") && value.endsWith("'"))
		) {
			value = value.slice(1, -1)
		}

		process.env[key] = value
	}
}

export default {config}
