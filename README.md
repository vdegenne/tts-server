## Back

```
npm run start:server [--watch]
```

(use `--watch` if you need the server to restart when you change its code.)

## Front

### Install API

```
npm i -D @vdegenne/tts-server
```

### Usage

```
import {tts} from '@vdegenne/tts-server'

tts({text: 'こんにちは'})
```
