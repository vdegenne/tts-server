import {getApi, type TTSArgs} from './api.ts'
import {buildTTSHash} from './utils.ts'

type CacheEntry = {
	blob?: Blob
	inFlight?: Promise<Blob>
}

type AudioWrapper = {
	end: Promise<void>
	play: () => void
	stop: () => void
	element?: HTMLAudioElement
}

export class AudioManager {
	private cache = new Map<string, CacheEntry>()

	tts(args: TTSArgs): AudioWrapper {
		let audio: HTMLAudioElement | undefined
		let objectUrl: string | undefined

		let resolveEnd!: () => void
		const end = new Promise<void>((resolve) => {
			resolveEnd = resolve
		})

		let stopped = false
		let loadingPromise: Promise<HTMLAudioElement> | null = null

		const wrapper: AudioWrapper = {
			end,

			element: undefined,

			play: () => {
				if (stopped) return

				if (audio) {
					void audio.play()
					return
				}

				if (!loadingPromise) {
					loadingPromise = this.loadAudio(args).then((a) => {
						if (stopped) {
							a.pause()
							return a
						}

						audio = a
						wrapper.element = a

						a.onended = () => {
							this.cleanup(objectUrl)
							resolveEnd()
						}

						void a.play()
						return a
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
		}

		return wrapper
	}

	private async loadAudio(args: TTSArgs): Promise<HTMLAudioElement> {
		const hash = await buildTTSHash(args)

		const blob = await this.getOrFetchBlob(hash, args)

		const url = URL.createObjectURL(blob)

		const audio = new Audio(url)

		return audio
	}

	private async getOrFetchBlob(hash: string, args: TTSArgs): Promise<Blob> {
		let entry = this.cache.get(hash)

		if (!entry) {
			entry = {}
			this.cache.set(hash, entry)
		}

		if (entry.blob) {
			return entry.blob
		}

		if (entry.inFlight) {
			return entry.inFlight
		}

		entry.inFlight = this.fetchTTS(args).then((blob) => {
			entry!.blob = blob
			entry!.inFlight = undefined
			return blob
		})

		return entry.inFlight
	}

	private async fetchTTS(args: TTSArgs): Promise<Blob> {
		const {ok, blob} = await getApi().post('tts', args)

		if (!ok) {
			throw new Error('TTS request failed')
		}

		return await blob()
	}

	private cleanup(url?: string) {
		if (url) {
			URL.revokeObjectURL(url)
		}
	}
}
