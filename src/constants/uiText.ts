/**
 * UIテキスト定義
 * ターゲットユーザー: 小学校低学年（1-2年生）
 * ルール:
 *   - 小3以降の漢字にはふりがな（ルビ）を付ける
 *   - 英語は極力使わず、カタカナ表記
 *   - アイコンを主体に、テキストは補助的に使う
 */

export const UI_TEXT = {
  // ===== ツール名 =====
  tools: {
    brush:      { name: 'ペン',         tip: 'いろをぬるよ' },
    bucket:     { name: 'バケツ',       tip: 'おなじいろのところをまとめてぬるよ' },
    eyedropper: { name: 'スポイト',     tip: 'いろをひろってつかうよ' },
    eraser:     { name: 'けしゴム',     tip: 'ぬったいろをけすよ' },
  },

  // ===== 操作 =====
  actions: {
    undo:     { name: 'もどる',           tip: 'ひとつまえにもどるよ' },
    redo:     { name: 'すすむ',           tip: 'もどしたのをやめて、もういちどすすむよ' },
    zoomIn:   { name: '大きく',           tip: 'がめんを大きくするよ' },
    zoomOut:  { name: '小さく',           tip: 'がめんを小さくするよ' },
  },

  // ===== ファイル操作 =====
  file: {
    newSkin:    { name: 'あたらしくつくる', tip: 'あたらしいスキンをつくるよ' },
    download:   { name: 'ほぞん',             tip: 'スキンのファイルをパソコンにほぞんするよ' },
    import:     { name: 'よみこみ',         tip: 'もっているスキンをよみこむよ' },
  },

  // ===== パーツ名（正面から見たラベル） =====
  // ★ このエディターでは全UIを「正面から見た視点」に統一。
  //    画面の左 = ひだり、画面の右 = みぎ。
  //    Minecraft内部名(rightArm=キャラ右)と正面視の左右は逆になるため注意。
  //    rightArm(キャラ右=画面左) → 'ひだりうで'
  //    leftArm (キャラ左=画面右) → 'みぎうで'
  parts: {
    head:     'あたま',
    body:     'からだ',
    rightArm: 'ひだりうで',
    leftArm:  'みぎうで',
    rightLeg: 'ひだりあし',
    leftLeg:  'みぎあし',
  },

  // ===== レイヤー =====
  layers: {
    base:    { name: 'した',   tip: 'からだのすがただよ' },
    overlay: { name: 'うえ',   tip: 'ぼうしやふくなど、かさねてきるものだよ' },
  },

  // ===== 表示モード =====
  viewMode: {
    all:  { name: 'ぜんたい', tip: 'スキンぜんたいをみるよ' },
    part: { name: 'パーツ',   tip: 'ひとつのパーツをおおきくみるよ' },
  },

  // ===== モデル選択 =====
  modelSelect: {
    title:   'どっちのからだにする？',
    classic: { name: 'スティーブだい', desc: 'うでがふといタイプ' },
    slim:    { name: 'アレックスだい', desc: 'うでがほそいタイプ' },
  },

  // ===== 面（かお）の名前 =====
  faces: {
    front:  'まえ',
    back:   'うしろ',
    left:   'ひだり',
    right:  'みぎ',
    top:    'うえ',
    bottom: 'した',
  },

  // ===== カラー =====
  color: {
    palette:     'いろえらび',
    transparent: 'とうめい',
    opacity:     'すきとおりぐあい',
  },

  // ===== 3Dプレビュー レイヤー切替 =====
  previewLayer: {
    both:    { name: 'ぜんぶ',   tip: 'ぜんぶかさねてみるよ' },
    base:    { name: 'しただけ', tip: 'したのいろだけみるよ' },
    overlay: { name: 'うえだけ', tip: 'うえのいろだけみるよ' },
  },
} as const;
