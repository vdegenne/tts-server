import {config} from '@vdegenne/koa'
import {type TTSApi} from './api.js'
import {buildTTSHash} from './utils.js'
import {hasSomeJapanese} from 'asian-regexps'
import {ttsClient} from './tts-client.js'

config<TTSApi>({
	port: 37435,

	useCors: true,

	get: {
		ping: () => 'pong',
	},

	post: {
		tts({guard, ctx}) {
			const cacheLocation = './cache'
			let {text, model, voice, languageCode} = guard({
				allowAlien: true,
				required: ['text'],
			})
			if (!languageCode) {
				if (hasSomeJapanese(text)) {
					// languageCode = 'ja-JP'
				}
			}
			console.log(text, languageCode)
			if (!languageCode) {
				ctx.throw(
					400,
					"A language code was not provided and couldn't be guessed.",
				)
			}
			// const hash = buildTTSHash({
			// 	text,
			// })

			// ttsClient.synthesizeSpeech({voice: {languageCode: ''}})
		},
	},
})
