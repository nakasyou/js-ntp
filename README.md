# @ns/ntp

Simple NTP client for Node/Deno/Bun.

## Usage

```ts
import { NTP } from '@ns/ntp'

const ntp = new NTP('ntp.nict.jp')
console.log(await ntp.getDate())
```

