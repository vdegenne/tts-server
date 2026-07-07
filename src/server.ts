import {google} from '@google-cloud/text-to-speech/build/protos/protos.js'
import {config} from '@vdegenne/koa'
import {hasSomeJapanese} from 'asian-regexps'
import fs, {ReadStream} from 'node:fs'
import {access, writeFile} from 'node:fs/promises'
import * as pathlib from 'path'
import {type TTSApi} from './api.js'
import {ttsClient} from './tts-client.ts'
import {
	audioEncodingToExtension,
	audioEncodingToMimeType,
	TTS_MODELS,
} from './types.ts'
import {buildTTSHash, isGeminiModel, voiceIsModel} from './utils.js'
import {type Voice, VOICE_ALIASES, VOICES} from './voice.ts'

const cacheLocation = './cache'

config<TTSApi>({
	port: 37435,

	useCors: true,

	get: {
		ping: () => 'pong',
	},

	post: {
		async tts({guard, ctx}) {
			/**
			 * GUARD/CHECKS
			 **************************/
			let {
				text,
				languageCode,
				voice,
				model,
				prompt,
				audioEncoding,
				pitch,
				rate,
				randomVoice,
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
				ctx.throw(
					400,
					'A language code could not be inferred, set it explicitely.',
				)
			}

			if (voice) {
				if (!VOICES.includes(voice)) {
					ctx.throw(400, 'This voice is unavailable.')
				}
			} else {
				voice ??= 'Achernar' // default
			}

			/**
			 * DEFAULTS
			 **************************/
			if (!voiceIsModel(voice) && !model) {
				// model ??= TTS_MODELS.GEMINI_3_1_FLASH_TTS
				// model ??= TTS_MODELS.GEMINI_2_5_FLASH_LITE_TTS
				// model ??= TTS_MODELS.GEMINI_2_5_PRO_TTS
				// model ??= TTS_MODELS.CHIRP_3_HD
				// model ??= TTS_MODELS.CHIRP_HD
				model ??= TTS_MODELS.WAVENET
			}
			audioEncoding ??= 'MP3' // default to mp3
			pitch ??= 0
			rate ??= 1

			/**
			 * NORMALIZATION
			 **************************/
			if (randomVoice) {
				voice = VOICE_ALIASES[
					Math.floor(Math.random() * VOICE_ALIASES.length)
				] as Voice
			}
			if (model && !isGeminiModel(model) && !voiceIsModel(voice)) {
				const composedVoice =
					`${languageCode}-${model}-${voice}` as unknown as Voice

				if (!VOICES.includes(composedVoice)) {
					ctx.throw(`The inferred voice is not available (${composedVoice})`)
				}

				voice = composedVoice
				// model = undefined
			}
			if (model && !isGeminiModel(model) && voiceIsModel(voice)) {
				model = undefined
			}
			if (model && isGeminiModel(model) && voiceIsModel(voice)) {
				ctx.throw("Shouldn't happen")
			}

			if (
				voiceIsModel(voice) &&
				model &&
				!voice.startsWith(`${languageCode}-${model}-`)
			) {
				ctx.throw(
					400,
					"Ambiguity found. Voice contains a model information and it doesn't match the value of model explicitely given.",
				)

				// If the model is included into the voice name we unset the model.
				model = undefined
			}

			// TODO: should normalize the prompt (e.g. all lowercase?)?
			if (model && !isGeminiModel(model)) {
				// NOTE: Assume all non-gemini models can't have a prompt.
				prompt = undefined
			}
			if (prompt === 'default') {
				prompt = 'Read aloud in a warm, welcoming tone.'
			}

			// TODO: should we add this feature back?
			// if (voice === 'random') {
			// 	voice = VOICE_ALIASES[
			// 		Math.floor(Math.random() * VOICE_ALIASES.length)
			// 	] as VoiceAlias
			// 	console.log(`Picking random voice: ${voice}`)
			// }

			/**
			 * VARS
			 **************************/
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
			const extension = audioEncodingToExtension[audioEncoding]
			if (!extension) {
				ctx.throw("Extension couldn't be determined")
			}
			const mimeType = audioEncodingToMimeType[audioEncoding]
			if (!mimeType) {
				ctx.throw("MimeType couldn't be determined")
			}

			function sendAudio(
				audioContent:
					| ReadStream
					| google.cloud.texttospeech.v1.ISynthesizeSpeechResponse['audioContent'],
			) {
				ctx.type = mimeType
				ctx.body = audioContent

				if (audioContent instanceof ReadStream) {
					audioContent.on('error', (err) => {
						ctx.app.emit('error', err, ctx)
					})
				}
			}

			const cachedFilePath = pathlib.join(cacheLocation, `${hash}.${extension}`)

			// // prettier-ignore
			console.log({
				text,
				languageCode,
				model,
				voice,
				prompt,
				audioEncoding,
				pitch,
				rate,
				extension,
			})

			/**
			 * MAIN
			 **************************/
			try {
				// Do the file exist?
				await access(cachedFilePath)

				// Yes: send to the client
				console.log('FILE EXISTS, we send it.')
				sendAudio(fs.createReadStream(cachedFilePath))
				return
			} catch (err) {
				const code = (err as NodeJS.ErrnoException)?.code

				if (code !== 'ENOENT') {
					throw err
				}
			}
			// No: file doesn't exist, continue
			console.log("FILE DOESN'T EXIST, we fetch it")

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
			sendAudio(response.audioContent)

			// async cache write (non-blocking)
			void (async function save() {
				try {
					if (!response.audioContent) {
						throw new Error('No audioContent returned from TTS API')
					}

					await writeFile(
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
