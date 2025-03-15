// データベースの設定
// テスト用に一意のデータベースファイルを使用
const timestamp = new Date().getTime();
process.env.DATABASE_URL = `file:./test-${timestamp}.db`;

// Jestのグローバル関数をインポート
require('@jest/globals');

// Nextのグローバル定義
global.Request = class {};
global.Response = class {};