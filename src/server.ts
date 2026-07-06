import {config} from '@vdegenne/koa'
import {hasSomeJapanese} from 'asian-regexps'
import fs from 'fs'
import * as pathlib from 'path'
import {type TTSApi} from './api.js'
import {ttsClient} from './tts-client.ts'
import {audioEncodingToExtension} from './types.ts'
import {buildTTSHash, isGeminiModel, voiceIncludesModel} from './utils.js'
import {type Voice, VOICE_ALIASES, type VoiceAlias, VOICES} from './voice.ts'

const cacheLocation = './cache'

config<TTSApi>({
	port: 37435,

	useCors: true,

	get: {
		ping: () => 'pong',
	},

	post: {
		async tts({guard, ctx}) {
			let {
				text,
				languageCode,
				model,
				voice,
				prompt,
				audioEncoding,
				pitch,
				rate,
			} = guard({
				allowAlien: true,
				required: ['text'],
			})

			if (!languageCode) {
				if (hasSomeJapanese(text)) {
					languageCode = 'ja-JP'
				}
			}
			if (!languageCode) {
				return ctx.throw(
					400,
					'A language code was not provided and could not be inferred.',
				)
			}

			model ??= 'gemini-3.1-flash-tts-preview'
			// model ??= 'gemini-2.5-pro-tts'
			// model ??= 'Chirp3-HD'
			// model ??= 'Chirp-HD'
			// model ??= 'Wavenet'
			voice ??= 'Alnilam'
			audioEncoding ??= 'MP3' // default to mp3
			pitch ??= 0
			rate ??= 1
			if (!isGeminiModel(model)) {
				prompt = undefined
			}
			// TODO: should normalize the prompt

			/**
			 * TODO: resolve "random" voice before hashing ?
			 */
			// ?

			const hash = await buildTTSHash({
				text,
				languageCode,
				model,
				voice,
				prompt,
				audioEncoding,
				pitch,
				rate,
			})

			if (voice === 'random') {
				voice = VOICE_ALIASES[
					Math.floor(Math.random() * VOICE_ALIASES.length)
				] as VoiceAlias
				console.log(`picking random voice: ${voice}`)
			}

			if (!isGeminiModel(model) && !voiceIncludesModel(voice)) {
				const composedVoice = `${languageCode}-${model}-${voice}`
				// console.log('composed: ', composedVoice)
				if (!VOICES.includes(composedVoice as Voice)) {
					ctx.throw(`The inferred voice is not available (${composedVoice})`)
				} else {
					voice = composedVoice as Voice
				}
				model = undefined
			}

			const extension = audioEncodingToExtension[audioEncoding]
			if (!extension) {
				ctx.throw("Extension couldn't be determined")
			}

			// prettier-ignore
			console.log({text, languageCode, model, voice, prompt, audioEncoding, pitch, rate, extension})

			const [response] = await ttsClient.synthesizeSpeech({
				audioConfig: {
					audioEncoding,
					pitch,
					speakingRate: rate,
				},
				input: {text, prompt},
				voice: {
					languageCode,
					name: voice,
					modelName: model,
				},
			})

			// send to client immediately
			// TODO: this should adapt
			ctx.type = 'audio/mpeg'
			ctx.body = response.audioContent

			// async cache write (non-blocking)
			void (async function save() {
				try {
					if (!response.audioContent) {
						throw new Error('No audioContent returned from TTS API')
					}

					await fs.promises.writeFile(
						pathlib.join(cacheLocation, `${hash}.${extension}`),
						response.audioContent,
					)
				} catch (e) {
					console.error('cache write failed', e)
				}
			})()
		},
	},
})
