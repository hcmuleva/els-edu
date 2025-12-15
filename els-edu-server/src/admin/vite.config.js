import { mergeConfig } from 'vite';
export default (config) => {
  return mergeConfig(config, {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      allowedHosts: ["emeelan.com", ".emeelan.com", "emeelan.in", ".emeelan.in"],
    },
  });
};
