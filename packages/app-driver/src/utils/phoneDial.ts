import { Alert, Linking } from 'react-native';

export function dialPeerPhone(phone: string | null | undefined, missingMessage = 'Номер недоступний') {
  const p = phone?.replace(/\s/g, '') ?? '';
  if (!p) {
    Alert.alert('Дзвінок', missingMessage);
    return;
  }
  Linking.openURL(`tel:${p}`).catch(() =>
    Alert.alert('Дзвінок', 'Не вдалося відкрити набір номера')
  );
}
