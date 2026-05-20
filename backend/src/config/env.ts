import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const portaPadrao = 3000;
const jwtSegredoPadrao = 'pillgator-desenvolvimento-segredo-local';

export const env = {
  porta: Number(process.env.PORT ?? portaPadrao),
  bancoUrl:
    process.env.DATABASE_URL ??
    'postgresql://abp4user:abp4pass@localhost:5432/abp4',
  jwtSegredo: process.env.JWT_SECRET ?? jwtSegredoPadrao,
  jwtExpiracao: process.env.JWT_EXPIRES_IN ?? '8h',
  expoPushUrl:
    process.env.EXPO_PUSH_URL ?? 'https://exp.host/--/api/v2/push/send'
};
