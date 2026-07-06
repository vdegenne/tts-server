import {getApi, type TTSArgs} from './api.ts'

export type AudioWrapper = {
	end: Promise<void>
	play: () => void
	stop: () => void
	toggle: () => void
	element?: HTMLAudioElement
}

export type TTSOptions = {
	autoplay?: boolean
	pauseToggle?: boolean
}

function buildTTSHash(args: TTSArgs): string {
	return JSON.stringify(args, Object.keys(args).sort())
}

export class AudioManager {
	private cache = new Map<string, AudioWrapper>()

	tts(args: TTSArgs, options: TTSOptions = {}): AudioWrapper {
		const hash = buildTTSHash(args)

		const existing = this.cache.get(hash)
		if (existing) return existing

		const wrapper = this.createWrapper(args, options)
		this.cache.set(hash, wrapper)
		return wrapper
	}

	private createWrapper(args: TTSArgs, options: TTSOptions): AudioWrapper {
		const autoplay = options.autoplay ?? true
		const pauseToggle = options.pauseToggle ?? false

		let audio: HTMLAudioElement | undefined
		let objectUrl: string | undefined

		let disposed = false
		let shouldPlay = autoplay

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
				if (disposed) return

				shouldPlay = true

				if (audio) {
					void audio.play()
					return
				}

				if (!inFlight) {
					inFlight = load().then((a) => {
						if (disposed || !shouldPlay) {
							a.pause()
							a.currentTime = 0
							return
						}

						wrapper.element = a
						audio = a
						void a.play()
					})
				}
			},

			stop: () => {
				disposed = true
				shouldPlay = false

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
					shouldPlay = !shouldPlay
					if (shouldPlay) wrapper.play()
					return
				}

				if (audio.paused) {
					shouldPlay = true
					void audio.play()
				} else {
					shouldPlay = false

					if (pauseToggle) {
						audio.pause()
					} else {
						audio.pause()
						audio.currentTime = 0
					}
				}
			},
		}

		return wrapper
	}

	private async fetchOrGetBlob(args: TTSArgs): Promise<Blob> {
		const hash = buildTTSHash(args)

		const existing = this.cache.get(hash)
		if (existing?.element) {
			throw new Error('Blob reuse not implemented in this path')
		}

		const res = await getApi().post('tts', args)

		if (!res.ok) {
			throw new Error('TTS request failed')
		}

		return await res.blob()
	}

	private cleanup(url?: string) {
		if (url) URL.revokeObjectURL(url)
	}
}
