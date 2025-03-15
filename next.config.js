/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  compiler: {
    // SWCを有効にする
    styledComponents: true,
  },
  experimental: {
    // Babelの設定を無視する
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig; 