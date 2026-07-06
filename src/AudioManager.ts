import {getApi, type TTSArgs} from './api.ts'

export type AudioWrapper = {
	end: Promise<void>
	play: () => void
	stop: () => void
	toggle: () => void
	element?: HTMLAudioElement
}

function buildTTSHash(args: TTSArgs): string {
	return JSON.stringify(args, Object.keys(args).sort())
}

export class AudioManager {
	private cache = new Map<string, AudioWrapper>()

	tts(args: TTSArgs): AudioWrapper {
		const hash = buildTTSHash(args)

		const existing = this.cache.get(hash)
		if (existing) return existing

		const wrapper = this.createWrapper(args)
		this.cache.set(hash, wrapper)
		return wrapper
	}

	private createWrapper(args: TTSArgs): AudioWrapper {
		let audio: HTMLAudioElement | undefined
		let objectUrl: string | undefined

		let stopped = false

		let resolveEnd!: () => void
		const end = new Promise<void>((resolve) => {
			resolveEnd = resolve
		})

		let inFlight: Promise<void> | null = null

		const load = async () => {
			const blob = await this.fetchOrGetBlob(args)

			objectUrl = URL.createObjectURL(blob)
			audio = new Audio(objectUrl)

			audio.onended = () => {
				this.cleanup(objectUrl)
				resolveEnd()
			}

			return audio
		}

		const wrapper: AudioWrapper = {
			end,
			element: undefined,

			play: () => {
				if (stopped) return

				if (audio) {
					void audio.play()
					return
				}

				if (!inFlight) {
					inFlight = load().then((a) => {
						if (stopped) {
							a.pause()
							return
						}

						wrapper.element = a
						audio = a

						void a.play()
					})
				}
			},

			stop: () => {
				stopped = true

				if (audio) {
					audio.pause()
					audio.currentTime = 0
				}

				if (objectUrl) {
					this.cleanup(objectUrl)
					objectUrl = undefined
				}

				resolveEnd()
			},

			toggle: () => {
				if (!audio) {
					wrapper.play()
					return
				}

				if (audio.paused) {
					void audio.play()
				} else {
					audio.pause()
				}
			},
		}

		return wrapper
	}

	private async fetchOrGetBlob(args: TTSArgs): Promise<Blob> {
		const hash = buildTTSHash(args)

		// try to reuse wrapper-level fetch if already cached indirectly
		const existing = this.cache.get(hash)
		if (existing?.element) {
			return await this.extractBlobFromAudio(existing.element)
		}

		const res = await getApi().post('tts', args)

		if (!res.ok) {
			throw new Error('TTS request failed')
		}

		return await res.blob()
	}

	private async extractBlobFromAudio(_audio: HTMLAudioElement): Promise<Blob> {
		// placeholder: not used in this architecture path
		throw new Error('Not implemented')
	}

	private cleanup(url?: string) {
		if (url) URL.revokeObjectURL(url)
	}
}
