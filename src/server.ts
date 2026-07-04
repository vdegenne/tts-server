import {config} from '@vdegenne/koa'
import {type ttsApi} from './api.js'

config<ttsApi>({
	port: 37435,

	// useCors: true,

	get: {
		ping: () => 'pong',
	},

	post: {
		tts({ctx, body}) {
			console.log(body)
		},
	},
})
