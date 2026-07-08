import {getApi, type TTSArgs} from './api.ts'

export type AudioWrapper = {
	error: Promise<Error>
	play: () => Promise<void>
	stop: () => void
	toggle: () => Promise<void>
	element?: HTMLAudioElement
	/**
	 * The hash associated with the request's params
	 */
	hash: string | undefined
}

export type TTSOptions = {
	/**
	 * @default true
	 */
	// autoplay: boolean

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

// function buildTTSHash(args: TTSArgs): string {
// 	return JSON.stringify(args, Object.keys(args).sort())
// }
async function getHash(input: string | object): Promise<string> {
	function sortObject(value: unknown): unknown {
		if (Array.isArray(value)) {
			return value.map(sortObject)
		}

		if (value !== null && typeof value === 'object') {
			return Object.fromEntries(
				Object.entries(value)
					.sort(([a], [b]) => a.localeCompare(b))
					.map(([key, val]) => [key, sortObject(val)]),
			)
		}

		return value
	}

	const normalized =
		typeof input === 'string' ? input : JSON.stringify(sortObject(input))

	// console.log('normalized: ', normalized)

	const data = new TextEncoder().encode(normalized)
	const hashBuffer = await crypto.subtle.digest('SHA-256', data)

	return Array.from(new Uint8Array(hashBuffer))
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('')
}

export class AudioManager {
	private cache = new Map<string, AudioWrapper>()

	async tts(
		args: TTSArgs,
		options?: Partial<TTSOptions>,
	): Promise<AudioWrapper> {
		const _options: TTSOptions = {
			// autoplay: true,
			pauseToggle: false,
			prefetch: true,
			...options,
		}

		// const hash = buildTTSHash(args)
		const hash = await getHash(args)

		const existing = this.cache.get(hash)
		if (existing) return existing

		const wrapper = this.createWrapper(args, _options)
		wrapper.hash = hash

		this.cache.set(hash, wrapper)

		return wrapper
	}

	private createWrapper(args: TTSArgs, options: TTSOptions): AudioWrapper {
		const {pauseToggle} = options

		let audio: HTMLAudioElement | undefined
		let objectUrl: string | undefined

		let disposed = false
		let shouldPlay = false

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

			hash: undefined,
		}

		if (options.prefetch) {
			void loadPromise().catch(() => {
				// Exposed through wrapper.error
			})
		}

		// if (shouldPlay) {
		// 	void wrapper.play().catch(() => {
		// 		// Exposed through wrapper.error
		// 	})
		// }

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
