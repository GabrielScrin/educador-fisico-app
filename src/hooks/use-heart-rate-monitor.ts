import { useCallback, useEffect, useRef, useState } from 'react';
import type { Device, Subscription } from 'react-native-ble-plx';

import {
  HEART_RATE_MEASUREMENT_UUID,
  HEART_RATE_SERVICE_UUID,
  decodificarFrequenciaCardiaca,
  obterBleManager,
  solicitarPermissoesBluetooth,
} from '@/lib/ble';

export type EstadoMonitorFc = 'desconectado' | 'procurando' | 'conectando' | 'conectado' | 'erro';

// Monitor de FC via Bluetooth (perfil padrão "Heart Rate", 0x180D) — funciona com qualquer
// monitor de peito/pulso que anuncie esse serviço (Polar, Garmin, cintas genéricas), sem código
// específico de marca. Ainda NÃO testado em device físico: BLE exige módulo nativo, ou seja, uma
// build EAS nova (o dev client atual não tem `react-native-ble-plx` compilado) — ver
// PASSAGEM_DE_PLANTAO.md antes de considerar essa feature pronta.
export function useMonitorFrequenciaCardiaca() {
  const [estado, setEstado] = useState<EstadoMonitorFc>('desconectado');
  const [bpm, setBpm] = useState<number | null>(null);
  const [dispositivos, setDispositivos] = useState<Device[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  const dispositivoConectado = useRef<Device | null>(null);
  const assinatura = useRef<Subscription | null>(null);

  const pararScan = useCallback(() => {
    obterBleManager()
      .stopDeviceScan()
      .catch(() => {});
  }, []);

  const iniciarScan = useCallback(async () => {
    setErro(null);
    setDispositivos([]);
    const permitido = await solicitarPermissoesBluetooth();
    if (!permitido) {
      setErro('Permissão de Bluetooth negada.');
      setEstado('erro');
      return;
    }
    setEstado('procurando');
    obterBleManager().startDeviceScan([HEART_RATE_SERVICE_UUID], null, (erroScan, dispositivo) => {
      if (erroScan) {
        setErro(erroScan.message);
        setEstado('erro');
        return;
      }
      if (!dispositivo) return;
      setDispositivos((atual) => (atual.some((d) => d.id === dispositivo.id) ? atual : [...atual, dispositivo]));
    });
  }, []);

  const conectar = useCallback(
    async (dispositivo: Device) => {
      pararScan();
      setEstado('conectando');
      setErro(null);
      try {
        const conectado = await dispositivo.connect();
        await conectado.discoverAllServicesAndCharacteristics();
        dispositivoConectado.current = conectado;
        assinatura.current = conectado.monitorCharacteristicForService(
          HEART_RATE_SERVICE_UUID,
          HEART_RATE_MEASUREMENT_UUID,
          (erroMonitor, caracteristica) => {
            if (erroMonitor) {
              setErro(erroMonitor.message);
              setEstado('erro');
              return;
            }
            if (!caracteristica?.value) return;
            const valor = decodificarFrequenciaCardiaca(caracteristica.value);
            if (valor != null) setBpm(valor);
          },
        );
        setEstado('conectado');
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Falha ao conectar no monitor.');
        setEstado('erro');
      }
    },
    [pararScan],
  );

  const desconectar = useCallback(async () => {
    assinatura.current?.remove();
    assinatura.current = null;
    if (dispositivoConectado.current) {
      await dispositivoConectado.current.cancelConnection().catch(() => {});
      dispositivoConectado.current = null;
    }
    setBpm(null);
    setEstado('desconectado');
  }, []);

  useEffect(
    () => () => {
      assinatura.current?.remove();
      if (dispositivoConectado.current) dispositivoConectado.current.cancelConnection().catch(() => {});
      pararScan();
    },
    [pararScan],
  );

  return { estado, bpm, dispositivos, erro, iniciarScan, pararScan, conectar, desconectar };
}
