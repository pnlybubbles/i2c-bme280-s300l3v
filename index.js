const i2c = require('i2c-bus')

const DEVICE_NUMBER = 1
// BME280 device address
const BME280 = 0x76

/**
 * 温度
 *
 * adc_T (unsigned int32 BE)
 * 0xF7 [19:12]
 * 0xF8 [11:4]
 * 0xF9(7,6,5,4) [3:0]
 */
const ADDR_TEMP = 0xfa
const rbuf = Buffer.alloc(4)
/**
 * 補正
 *
 * dig_T1 (unsigned int16 LE)
 * 0x88 [7:0]
 * 0x89 [15:8]
 *
 * dig_T2 (signed int16 LE)
 * 0x8A [7:0]
 * 0x8B [15:8]
 *
 * dig_T3 (signed int16 LE)
 * 0x8C [7:0]
 * 0x8D [15:8]
 */
const ADDR_DIG_T = 0x88
const buf_dig_t = Buffer.alloc(6)
// ctrl_meas
const ADDR_CTRL_MEAS = 0xf4
const ctrl_meas = 0b00100111

;(async () => {
  const bus = await i2c.openPromisified(DEVICE_NUMBER)
  const dig_t = await bus.readI2cBlock(BME280, ADDR_DIG_T, 6, buf_dig_t)
  await bus.writeByte(BME280, ADDR_CTRL_MEAS, ctrl_meas)
  const temp = await bus.readI2cBlock(BME280, ADDR_TEMP, 3, rbuf)
  bus.close()
  console.log('dig_t')
  pp(ADDR_DIG_T, dig_t.buffer)
  console.log('temp')
  pp(ADDR_TEMP, temp.buffer, 3)
  const adc_T = temp.buffer.readUInt32BE(0) >>> (4 * 3)
  const dig_T1 = dig_t.buffer.readUInt16LE(0)
  const dig_T2 = dig_t.buffer.readInt16LE(2)
  const dig_T3 = dig_t.buffer.readInt16LE(4)
  const var1 = (((adc_T >>> 3) - (dig_T1 << 1)) * dig_T2) >> 11
  const var2 =
    (((((adc_T >>> 4) - dig_T1) * ((adc_T >>> 4) - dig_T1)) >> 12) * dig_T3) >>
    14
  const t_fine = var1 + var2
  const T = ((t_fine * 5 + 128) >> 8) / 100
  console.log(`Temperature: ${T} C`)
})()

function pp(addr, buffer, trim = buffer.length) {
  for (let i = 0; i < trim; i++) {
    console.log(
      '0x' + (addr + i).toString(16).padStart(2, '0'),
      buffer[i].toString(2).padStart(8, '0'),
      buffer[i].toString(16).padStart(2, '0')
    )
  }
}
