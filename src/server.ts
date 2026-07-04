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
		tts({guard, body}) {
			const cacheLocation = './cache'
			let {text, model, voice, languageCode} = guard({
				allowAlien: true,
				required: ['text'],
			})
			if (!languageCode) {
				if (hasSomeJapanese(text)) {
					languageCode = 'ja-JP'
				}
			}
			const hash = buildTTSHash({})

			ttsClient.synthesizeSpeech({voice: {languageCode: ''}})
		},
	},
})
