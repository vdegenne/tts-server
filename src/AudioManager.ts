import {getApi, type TTSArgs} from './api.ts'

export type AudioWrapper = {
	error: Promise<Error>
	play: () => Promise<void>
	stop: () => void
	toggle: () => Promise<void>
	element?: HTMLAudioElement
}

export type TTSOptions = {
	/**
	 * @default true
	 */
	autoplay: boolean

	/**
	 * @default false
	 */
	pauseToggle: boolean

	/**
	 * Do not need to wait the sound to be initially played (.play() or .toggle())
	 * to fetch the resource.
	 *
	 * @default true
	 */
	prefetch: boolean
}

function buildTTSHash(args: TTSArgs): string {
	return JSON.stringify(args, Object.keys(args).sort())
}

export class AudioManager {
	private cache = new Map<string, AudioWrapper>()

	tts(args: TTSArgs, options?: Partial<TTSOptions>): AudioWrapper {
		const _options: TTSOptions = {
			autoplay: true,
			pauseToggle: false,
			prefetch: true,
			...options,
		}

		const hash = buildTTSHash(args)

		const existing = this.cache.get(hash)
		if (existing) return existing

		const wrapper = this.createWrapper(args, _options)

		this.cache.set(hash, wrapper)

		return wrapper
	}

	private createWrapper(args: TTSArgs, options: TTSOptions): AudioWrapper {
		const {autoplay, pauseToggle} = options

		let audio: HTMLAudioElement | undefined
		let objectUrl: string | undefined

		let disposed = false
		let shouldPlay = autoplay

		let rejectError!: (error: Error) => void

		const error = new Promise<Error>((resolve) => {
			rejectError = resolve
		})

		let loading: Promise<HTMLAudioElement> | undefined

		function fail(err: unknown) {
			const error = err instanceof Error ? err : new Error(String(err))

			rejectError(error)
		}

		function waitForEnd(element: HTMLAudioElement): Promise<void> {
			return new Promise((resolve, reject) => {
				element.onended = () => resolve()

				element.onerror = () => {
					reject(new Error('Audio playback failed'))
				}
			})
		}

		const load = async () => {
			try {
				const blob = await this.fetchOrGetBlob(args)

				objectUrl = URL.createObjectURL(blob)

				const element = new Audio(objectUrl)

				element.onerror = () => {
					fail(new Error('Audio playback failed'))
				}

				audio = element

				return element
			} catch (err) {
				fail(err)
				throw err
			}
		}

		function loadPromise() {
			return (loading ??= load())
		}

		const wrapper: AudioWrapper = {
			error,

			element: undefined,

			play: async () => {
				if (disposed) return

				shouldPlay = true

				try {
					const element = audio ?? (await loadPromise())

					if (disposed || !shouldPlay) {
						element.pause()
						element.currentTime = 0
						return
					}

					wrapper.element = element

					await element.play()
					await waitForEnd(element)

					this.cleanup(objectUrl)
					objectUrl = undefined
				} catch (err) {
					fail(err)
					throw err
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
			},

			toggle: async () => {
				if (!audio) {
					shouldPlay = !shouldPlay

					if (shouldPlay) {
						await wrapper.play()
					}

					return
				}

				if (audio.paused) {
					shouldPlay = true

					try {
						await audio.play()
						await waitForEnd(audio)
					} catch (err) {
						fail(err)
						throw err
					}
				} else {
					shouldPlay = false

					audio.pause()

					if (!pauseToggle) {
						audio.currentTime = 0
					}
				}
			},
		}

		if (options.prefetch) {
			void loadPromise().catch(() => {
				// Exposed through wrapper.error
			})
		}

		if (shouldPlay) {
			void wrapper.play().catch(() => {
				// Exposed through wrapper.error
			})
		}

		return wrapper
	}

	private async fetchOrGetBlob(args: TTSArgs): Promise<Blob> {
		const res = await getApi().post('tts', args)

		if (!res.ok) {
			throw new Error('TTS request failed')
		}

		return await res.blob()
	}

	private cleanup(url?: string) {
		if (url) {
			URL.revokeObjectURL(url)
		}
	}
}
