/**
 * BLE protocol used by the IMU belt (see Acquisition_Interface/live_gui_ble.py).
 *
 * Hardware: Arduino Nano 33 IoT — supports both BLE and Wi-Fi, so the same
 * service can later expose either transport without changing the firmware
 * board. Current firmware uses BLE only.
 *
 * GATT characteristics:
 *   - IMU notify: streams 24 bytes per packet (6 little-endian floats:
 *     ax,ay,az,gx,gy,gz) at ~100 Hz once streaming is started.
 *   - Control write: 1 byte command (START / STOP / POWER_OFF).
 *   - File-name write: UTF-8 bytes, sets the file name the Arduino writes to
 *     its SD card. Must be written BEFORE START.
 */
export const BeltBleProtocol = {
  // Replace with your service UUID if the firmware advertises one; the Python
  // client currently connects directly by MAC, so service discovery isn't
  // strictly required.
  serviceUuid: '123e4567-e89b-12d3-a456-426614174000',

  imuCharacteristicUuid:      '123e4567-e89b-12d3-a456-426614174020',
  controlCharacteristicUuid:  '123e4567-e89b-12d3-a456-426614174004',
  fileNameCharacteristicUuid: '223e4567-e89b-12d3-a456-426614174005',

  // 1-byte control commands written to controlCharacteristicUuid.
  command: {
    START_STREAM: 0x01,
    STOP_STREAM:  0x00,
    POWER_OFF:    0x02,
  },

  sampleRateHz: 100,
  bytesPerSample: 24, // 6 * sizeof(float32)
} as const;

/** Known belts in the lab. Add more as needed. */
export const KNOWN_BELTS: Array<{ label: string; mac: string }> = [
  { label: 'Arduino Cristiana', mac: '34:94:54:27:D1:BE' },
  { label: 'Arduino Luís Martins', mac: 'E0:5A:1B:7A:39:2A' },
];
