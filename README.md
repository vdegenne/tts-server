## Back

Create a service account on Google Cloud first and download a config file (save it at the root of this project), rename it to `service-account.json`.
**(!) If you fork this in the public domain, do not remove `service-account.json` from `.gitignore` !**

Then,

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

## Notes

- If you bump the versions, beware `@google-cloud/text-to-speech` internal `google-auth-libary` library has a mismatch with the one installed in this project. Try to make them match together.
