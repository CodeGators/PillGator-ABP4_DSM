import Constants from 'expo-constants';
import { Platform } from 'react-native';

type ExtraConfig = {
  apiUrl?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as ExtraConfig;

function obterHostExpo() {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.platform?.hostUri;
  const host = hostUri?.split(':')[0];

  return host && host !== 'localhost' ? host : null;
}

function obterApiUrlPadrao() {
  const hostExpo = obterHostExpo();

  if (hostExpo) {
    return `http://${hostExpo}:3000`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  return 'http://localhost:3000';
}

export const ambiente = {
  apiUrl: extra.apiUrl ?? process.env.EXPO_PUBLIC_API_URL ?? obterApiUrlPadrao(),
};
