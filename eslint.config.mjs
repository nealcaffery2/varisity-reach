import next from 'eslint-config-next';

const config = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', '.claude/**', 'supabase/**', 'next-env.d.ts'] },
  ...next,
];

export default config;
