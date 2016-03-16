# quickblox チャットコンポーネント

## Overview
quickbloxを利用したチャット機能を実装するReactコンポーネントおよびサーバーAPI。

APIはNode/Expressで実装。
パッケージ管理はnpm。

## Settings
カスタムクラスを作成
https://admin.quickblox.com/apps/36754/service/custom?class_id=56e77ba1a0eb47b178000054

## Development

### Install
依存パッケージをインストールします。

`$ npm install`

### Build
Reactのコンポーネントをビルドします。

`$ npm run buid`

ビルドされたスクリプトは
/public/javascript/chat-bundle.js
に出力されます。

### Watch
nodeサーバーを起動し、JavaScriptへの変更を随時ビルドして反映します。

`$ npm run watch`

フロントエンドだけwatchする場合：
`$ npm run watch-front`

バックエンドだけwatchする場合：
`$ npm run watch-back`

### Test
自動テストを実行します。

`$ npm run test`
