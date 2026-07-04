import {config} from '@vdegenne/koa'
import {type ttsApi} from './api.js'
import dotenv from './dotenv.js'
import {getHash} from './utils.js'

dotenv.config()

// console.log(process.env.GOOGLE_TTS_API_KEY)

config<ttsApi>({
	port: 37435,

	useCors: true,

	get: {
		ping: () => 'pong',
	},

	post: {
		tts({guard}) {
			const {text} = guard({required: ['text']})
			// const hash = getHash(text)
		},
	},
})
