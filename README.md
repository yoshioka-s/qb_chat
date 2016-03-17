# quickblox チャットコンポーネント

## 概要
quickbloxを利用したチャット機能を実装するためのReactコンポーネント。

Nodeサーバーはindex.htmlをサーブしているのみで、ロジックは全てフロントエンドで実装されています。
よって既存のWEBサイトに追加する際はサーバーのデプロイは不要です。

## 設定
### quickbloxアカウントの設定
1. [quickblox](https://www.google.com)アカウントを登録します。
2. New Appボタンから新しいアプリを登録します。
3. 作成したアプリのApplication ID、Authorization key、Authorization secretを/settings/quickblox.jsのappId、authKey、authSecretにそれぞれ設定します。
4. 作成したアプリのCustomページにて、カスタムオブジェクトを設定します。AddボタンからAdd New Classを選択し、Class name: product_dialog, Field name: main_operator (integer)　と設定してCreate Classボタンをクリックしてください。
5. 作成したアプリのOverviewページのSettingsタブで、「Allow to retrieve a list of users」のチェックを付けてSaveボタンをクリックします。

### オペレーター用ユーザーの作成
別パッケージでお渡しするオペレーター登録ツールを使って、オペレーターユーザーを登録します。

各商品ページに本モジュールを統合する際は、このツールで表示される担当オペレーターのユーザーIDを、/public/javascript/chat.jsにてChatModuleに配列として渡します。（現状、複数オペレーター未対応のため、要素数１の配列を渡してください。）

```javascript
ReactDOM.render(
  <div>
    <ChatModule adminIds={[ユーザーID]}/>
  </div>,
  document.getElementById('chat-module')
);
```

## ビルド

### Install
依存パッケージをインストールします。

`$ npm install`

### Build
Reactのコンポーネントをビルドします。

`$ npm run buid`

ビルドされたスクリプトは
/public/javascript/chat-bundle.js
に出力されます。

### HTML
/public/index.htmlは本モジュールの使用例です。
htmlでは本モジュール（/public/javascript/chat-bundle.js）を読み込む前にjQueryライブラリを読み込むようにしてください。


## カスタマイズ
本モジュールはReact.jsを使ってHTMLを生成します。HTMLのキャプションや構造を修正するには、
/public/javascript/components以下のjsxファイルのrenderメソッドを修正してください。

修正後は再度ビルドしてchat-bundle.jsを生成してください.
