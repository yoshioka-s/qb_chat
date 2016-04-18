# quickblox チャットコンポーネント

## 概要
quickbloxを利用したチャット機能を実装するためのReactコンポーネント（オペレーター側）
およびライブラリ（顧客側）。

Nodeサーバーはセッションを設定しindex.htmlをサーブしているのみで、ロジックは全てフロントエンドで実装されています。

## 設定
### quickbloxアカウントの設定
1. [quickblox](https://www.google.com)アカウントを登録します。
2. New Appボタンから新しいアプリを登録します。
3. 作成したアプリのApplication ID、Authorization key、Authorization secretを/settings/quickblox.jsのappId、authKey、authSecretにそれぞれ設定します。
4. 作成したアプリのCustomページにて、カスタムオブジェクトを設定します。AddボタンからAdd New Classを選択し、Class name: shop_dialog, Field name: customerId (integer), shopId (string)　と設定してCreate Classボタンをクリックしてください。
5. 作成したアプリのOverviewページのSettingsタブで、「Allow to retrieve a list of users」のチェックを付けてSaveボタンをクリックします。

### NodeサーバーのSessionの設定
クライアントサイドでクッキーに保存されたセッションIDを読み取るため、
sessionのhttpOnlyオプションはfalseに設定してください。

また、/public/javascript/chatUtils.jsの `COOKIE_SID` 変数にセッションIDが保存されるクッキーの名前を設定してください。

### オペレーター用ユーザーの作成
別パッケージでお渡しするオペレーター登録ツールを使って、オペレーターユーザーを登録します。

## ビルド

### Install
依存パッケージをインストールします。

`$ npm install`

### Build
Reactのコンポーネントをビルドします。

`$ npm run buid`

ビルドされたスクリプトは
 - /public/javascript/chat-bundle.js　（オペレーター側モジュール）
 - /public/javascript/chatUtils-bundle.js　（顧客側ライブラリ）
に出力されます。

### HTML
/public/index.htmlはオペレーター側モジュールの使用例です。
htmlでは本モジュール（/public/javascript/chat-bundle.js）を読み込む前にjQueryライブラリを読み込むようにしてください。

## カスタマイズ
本モジュールはReact.jsを使ってHTMLを生成します。HTMLのキャプションや構造を修正するには、
/public/javascript/components以下のjsxファイルのrenderメソッドを修正してください。

修正後は再度ビルドしてchat-bundle.jsを生成してください.
