/**
 * @example
 * ```ts
 * import { NTP } from '@ns/ntp'
 * 
 * const ntp = new NTP('ntp.nict.jp')
 * console.log(await ntp.getDate())
 * ```
 */

import dgram from 'node:dgram'
import { Buffer } from 'node:buffer'

const NTP_DELTA = 2208988800

/**
 * NTP client
 */
export class NTP {
  #host: string
  #port: number
  constructor(host: string, port = 123) {
    this.#host = host
    this.#port = port
  }

  /**
   * Get the current time in milliseconds
   * @param abortSignal AbortSignal to abort the request
   * @returns Time in milliseconds
   */
  getTime(abortSignal = AbortSignal.timeout(1000)): Promise<number> {
    const socket = dgram.createSocket('udp4')

    const firstPacket = Buffer.alloc(48)
    firstPacket[0] = 0x1B
    const t1 = performance.now()
    socket.send(firstPacket, 0, 48, this.#port, this.#host)

    return new Promise((resolve, reject) => {
      const abort = () => {
        socket.close()
        reject(new Error('Aborted request'))
      }
      socket.once('message', (msg) => {
        const t4 = performance.now()
        abortSignal.removeEventListener('abort', abort)
        socket.close()

        const t2Seconds = msg.readUInt32BE(32) - NTP_DELTA
        const t2Fraction = msg.readUInt32BE(36) * 1000 / 0x100000000
        const t3Seconds = msg.readUInt32BE(40) - NTP_DELTA
        const t3Fraction = msg.readUInt32BE(44) * 1000 / 0x100000000

        const t2 = t2Seconds * 1000 + t2Fraction
        const t3 = t3Seconds * 1000 + t3Fraction
        
        const offset = ((t2 - t1) + (t3 - t4)) / 2
        resolve(performance.now() + offset)
      })
  
      abortSignal.addEventListener('abort', abort)
    })
  }

  /**
   * Get the current date
   * @param abortSignal AbortSignal to abort the request
   * @returns Date
   */
  async getDate(abortSignal = AbortSignal.timeout(1000)): Promise<Date> {
    return new Date(await this.getTime(abortSignal))
  }
}
