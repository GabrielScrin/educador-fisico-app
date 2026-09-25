import { PermissionsAndroid, Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

// UUIDs do perfil Bluetooth padrão "Heart Rate" (Bluetooth SIG GATT, não é API do Expo/da lib) —
// qualquer monitor de FC que anuncie esse serviço (Polar, Garmin, cintas genéricas) funciona sem
// código específico de marca.
export const HEART_RATE_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
export const HEART_RATE_MEASUREMENT_UUID = '00002a37-0000-1000-8000-00805f9b34fb';

let manager: BleManager | null = null;

export function obterBleManager(): BleManager {
  if (!manager) manager = new BleManager();
  return manager;
}

// O config plugin (app.json) só declara as permissões no manifest/Info.plist — pedir em runtime
// continua sendo responsabilidade do app. Android 12+ (SDK 31+) usa BLUETOOTH_SCAN/CONNECT;
// versões mais antigas exigem ACCESS_FINE_LOCATION pra escanear BLE (exigência do próprio
// Android, documentada na wiki da lib, não da lib em si). iOS pede via prompt nativo na primeira
// chamada de scan, sem passo explícito daqui.
export async function solicitarPermissoesBluetooth(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  if (Platform.Version >= 31) {
    const resultado = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return Object.values(resultado).every((r) => r === PermissionsAndroid.RESULTS.GRANTED);
  }
  const resultado = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
  return resultado === PermissionsAndroid.RESULTS.GRANTED;
}

// Formato da característica "Heart Rate Measurement" (0x2A37, spec do Bluetooth SIG): byte 0 é
// flags — bit 0 diz se o valor de bpm vem como UINT8 (1 byte) ou UINT16 (2 bytes, little-endian)
// nos bytes seguintes. Padrão fixo do Bluetooth, igual em qualquer monitor compatível.
export function decodificarFrequenciaCardiaca(valorBase64: string): number | null {
  const bytes = base64ParaBytes(valorBase64);
  if (bytes.length < 2) return null;
  const valorEm16Bits = (bytes[0] & 0x01) === 1;
  if (valorEm16Bits) {
    if (bytes.length < 3) return null;
    return bytes[1] | (bytes[2] << 8);
  }
  return bytes[1];
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ParaBytes(base64: string): Uint8Array {
  const limpo = base64.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of limpo) {
    const valor = BASE64_CHARS.indexOf(char);
    if (valor === -1) continue;
    buffer = (buffer << 6) | valor;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
    }
  }
  return Uint8Array.from(bytes);
}
