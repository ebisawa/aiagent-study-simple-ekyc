module.exports = function (api) {
  // テスト環境でのみBabel設定を適用
  const isTest = api.env('test');
  api.cache(true);

  // テスト環境でのみプリセットを返す
  if (isTest) {
    return {
      presets: [
        ['@babel/preset-env', { targets: { node: 'current' } }],
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }]
      ],
    };
  }

  // テスト環境以外では空の設定を返す
  return {};
}; 