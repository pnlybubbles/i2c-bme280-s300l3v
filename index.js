const i2c = require('i2c-bus')

const DEVICE_NUMBER = 1
// BME280 device address
const BME280 = 0x76

/**
 * 温度
 *
 * adc_T (unsigned int32 BE)
 * 0xFa [19:12]
 * 0xFb [11:4]
 * 0xFc(7,6,5,4) [3:0]
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

/**
 * 湿度
 * 
 * adc_H (unsigned int32 BE)
 * 0xFD [15:8]
 * 0xFE [7:0]
 */
const ADDR_HUM = 0xfd
const rbufH = Buffer.alloc(4)
/**
 * 補正
 *
 * dig_H1 (signed int8)
 * 0xa1 [7:0]
 *
 * dig_H2 (signed int16 LE)
 * 0xe1 [7:0]
 * 0xe2 [15:8]
 *
 * dig_H3 (signed int8)
 * 0xe3 [7:0]
 * 
 * dig_H4 (signed int16 LE)
 * 0xe4 [11:4]
 * 0xe5 [7:0]
 * 
 * dig_H5 (signed int16 LE)
 * 0xe5 [7:0]
 * 0xe6 [11:4]
 * 
 * dig_H6 (signed int8)
 * 0xe7 [7:0]
 */
const ADDR_DIG_H1 = 0xa1
const buf_dig_h1 = Buffer.alloc(1)
const ADDR_DIG_H = 0xe1
const buf_dig_h = Buffer.alloc(7)
// ctrl_hum
const ADDR_CTRL_HUM = 0xf2
const ctrl_hum = 0b00000001



 /**
 * 気圧
 *
 * adc_P (unsigned int32 BE)
 * 0xF7 [19:12]
 * 0xF8 [11:4]
 * 0xF9(7,6,5,4) [3:0]
 */
const ADDR_PRES = 0xf7
const rbufP = Buffer.alloc(4)
/**
 * 補正
 *
 * dig_P1 (unsigned int16 LE)
 * 0x8E [7:0]
 * 0x8F [15:8]
 *
 * dig_P2 (signed int16 LE)
 * 0x90 [7:0]
 * 0x91 [15:8]
 *
 * dig_P3 (signed int16 LE)
 * 0x92 [7:0]
 * 0x93 [15:8]
 * 
 * dig_P4 (signed int16 LE)
 * 0x94 [7:0]
 * 0x95 [15:8]
 * 
 * dig_P5 (signed int16 LE)
 * 0x96 [7:0]
 * 0x97 [15:8]
 * 
 * dig_P6 (signed int16 LE)
 * 0x98 [7:0]
 * 0x99 [15:8]
 * 
 * dig_P7 (signed int16 LE)
 * 0x9A [7:0]
 * 0x9B [15:8]
 * 
 * dig_P8 (signed int16 LE)
 * 0x9C [7:0]
 * 0x9D [15:8]
 * 
 * dig_P9 (signed int16 LE)
 * 0x9E [7:0]
 * 0x9F [15:8]
 */
const ADDR_DIG_P = 0x8e
const buf_dig_p = Buffer.alloc(19)


;(async () => {
  const bus = await i2c.openPromisified(DEVICE_NUMBER)
  const dig_t = await bus.readI2cBlock(BME280, ADDR_DIG_T, 6, buf_dig_t)
  await bus.writeByte(BME280, ADDR_CTRL_MEAS, ctrl_meas)
  const temp = await bus.readI2cBlock(BME280, ADDR_TEMP, 3, rbuf)

  const dig_h = await bus.readI2cBlock(BME280, ADDR_DIG_H, 6, buf_dig_h)
  const dig_h1 = await bus.readI2cBlock(BME280, ADDR_DIG_H1, 1, buf_dig_h1)
  await bus.writeByte(BME280, ADDR_CTRL_HUM, ctrl_hum)
  const hum = await bus.readI2cBlock(BME280, ADDR_HUM, 2, rbufH)

  const dig_p = await bus.readI2cBlock(BME280, ADDR_DIG_P, 18, buf_dig_p)
  await bus.writeByte(BME280, ADDR_CTRL_MEAS, ctrl_meas)
  const pres = await bus.readI2cBlock(BME280, ADDR_PRES, 3, rbufP)

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
  


  console.log('dig_h1')
  pp(ADDR_DIG_H1, dig_h1.buffer)
  console.log('dig_h')
  pp(ADDR_DIG_H, dig_h.buffer)
  console.log('hum')
  pp(ADDR_HUM, hum.buffer,3)
  const adc_H = hum.buffer.readUInt16BE(0)
  const dig_H1 = dig_h1.buffer.readInt8(0)
  const dig_H2 = (dig_h.buffer.readInt16LE(1)<<8)|dig_h.buffer.readInt16LE(0)
  const dig_H3 = dig_h.buffer.readInt8(2)
  const dig_H4 = (dig_h.buffer.readInt16LE(3)<<4)|(dig_h.buffer.readInt16LE(4)&0x0f)
  const dig_H5 = (dig_h.buffer.readInt16LE(5)<<4)|((dig_h.buffer.readInt16LE(4)>>4)&0x0f)
  const dig_H6 = dig_h.buffer.readInt8(6)


  var v_x1 = (t_fine - (76800));
  v_x1 = (((((adc_H << 14) -((dig_H4) << 20) - ((dig_H5) * v_x1)) + 
              (16384)) >> 15) * (((((((v_x1 * (dig_H6)) >> 10) * 
              (((v_x1 * (dig_H3)) >> 11) + ( 32768))) >> 10) + (2097152)) * 
              ( dig_H2) + 8192) >> 14));
  v_x1 = (v_x1 - (((((v_x1 >> 15) * (v_x1 >> 15)) >> 7) * (dig_H1)) >> 4));
  v_x1 = (v_x1 < 0 ? 0 : v_x1);
  v_x1 = (v_x1 > 419430400 ? 419430400 : v_x1);
  const H=  ( v_x1 >> 12)
  const H1=  H/1024
  console.log(`Humidity: ${H1} %`)


  console.log('dig_p')
  pp(ADDR_DIG_P, dig_p.buffer)
  console.log('pres')
  pp(ADDR_PRES, pres.buffer,3)
  const adc_P = pres.buffer.readUInt32BE(0) >>> (4 * 3)
  const dig_P1 = dig_p.buffer.readUInt16LE(0)
  const dig_P2 = dig_p.buffer.readInt16LE(2)
  const dig_P3 = dig_p.buffer.readInt16LE(4)
  const dig_P4 = dig_p.buffer.readInt16LE(6)
  const dig_P5 = dig_p.buffer.readInt16LE(8)
  const dig_P6 = dig_p.buffer.readInt16LE(10)
  const dig_P7 = dig_p.buffer.readInt16LE(12)
  const dig_P8 = dig_p.buffer.readInt16LE(14)
  const dig_P9 = dig_p.buffer.readInt16LE(16)
     
  var   v1 = (t_fine / 2.0) - 64000.0
  var  v2 = (((v1 / 4.0) * (v1 / 4.0)) / 2048) * dig_P6
    v2 = v2 + ((v1 * dig_P5) * 2.0)
    v2 = (v2 / 4.0) + (dig_P4 * 65536.0)
    v1 = (((dig_P3 * (((v1 / 4.0) * (v1 / 4.0)) / 8192)) / 8)  + ((dig_P2 * v1) / 2.0)) / 262144
    v1 = ((32768 + v1) * dig_P1) / 32768
     
    if( v1 == 0){
      console.log(`pressure: 0 `)
    }
    pressure = ((1048576 - adc_P) - (v2 / 4096)) * 3125
    if( pressure < 0x80000000){
        pressure = (pressure * 2.0) / v1
      }else{
        pressure = (pressure / v1) * 2}
    v1 = (dig_P9 * (((pressure / 8.0) * (pressure / 8.0)) / 8192.0)) / 4096
    v2 = ((pressure / 4.0) * dig_P8) / 8192.0
    pressure = (pressure + ((v1 + v2 + dig_P7) / 16.0)  )/100
    console.log(`pressure: ${pressure}hPa `)

    console.log(`Temperature: ${T} C`)
    console.log(`Humidity: ${H1} %`)
    console.log(`pressure: ${pressure}hPa `)



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