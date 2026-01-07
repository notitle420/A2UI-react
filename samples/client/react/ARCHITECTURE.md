# React A2UI Client - Architecture Documentation

## Overview

React A2UI Client は、A2UI (Agent-to-UI) プロトコルをサポートするチャットインターフェースです。エージェントから受信したA2UIメッセージを動的にレンダリングし、インタラクティブな可視化（チャート、マップ）を提供します。

## Technology Stack

- **React 19** + TypeScript
- **Material-UI (MUI)** - UIコンポーネント
- **Zustand** - 状態管理
- **Vite** - ビルドツール
- **Chart.js** + react-chartjs-2 - チャート描画
- **@react-google-maps/api** - Google Maps統合
- **Express** - プロキシサーバー

---

## Directory Structure

```
src/
├── App.tsx                          # アプリケーションルート
├── main.tsx                         # エントリーポイント
├── theme.ts                         # MUIテーマ設定
│
├── components/
│   ├── chat/                        # チャットUI
│   │   ├── Chat.tsx                 # メインコンテナ
│   │   ├── ChatHistory.tsx          # メッセージ履歴
│   │   ├── Message.tsx              # 個別メッセージ
│   │   ├── InputArea.tsx            # 入力エリア
│   │   ├── AgentHeader.tsx          # エージェント情報
│   │   └── Avatar.tsx               # アバター表示
│   │
│   ├── a2a-renderer/                # A2Aメッセージレンダリング
│   │   ├── A2aRenderer.tsx          # 動的レンダラー
│   │   ├── A2uiDataPart.tsx         # A2UIデータパート
│   │   ├── DefaultTextPart.tsx      # テキストパート
│   │   ├── registry.ts              # レンダラー登録
│   │   └── resolvers/               # パートリゾルバー
│   │
│   ├── a2ui-catalog/                # A2UI可視化コンポーネント
│   │   ├── Canvas.tsx               # サーフェスコンテナ
│   │   ├── A2uiSurface.tsx          # コンポーネントレンダラー
│   │   ├── Chart.tsx                # Chart.jsラッパー
│   │   └── GoogleMap.tsx            # Google Mapsラッパー
│   │
│   └── layout/
│       └── MainLayout.tsx           # アプリシェル
│
├── stores/                          # Zustand状態管理
│   ├── chat-store.ts                # チャット・A2UIサーフェス状態
│   └── canvas-store.ts              # キャンバス表示状態
│
├── services/                        # 外部通信
│   ├── a2a-service.ts               # A2A APIクライアント
│   └── catalog-service.ts           # カタログURI管理
│
├── utils/                           # ユーティリティ
│   ├── a2ui-processor.ts            # A2UIメッセージ処理
│   ├── a2a.ts                       # A2Aレスポンス解析
│   ├── ui-message-utils.ts          # メッセージ変換
│   └── type-guards.ts               # 型ガード
│
└── types/                           # TypeScript型定義
    ├── ui-message.ts                # UIメッセージ型
    └── a2a-renderer.ts              # レンダラー型
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                           App.tsx                                    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Initialization:                                              │    │
│  │ - Part Resolvers設定                                         │    │
│  │ - Catalog URIs設定                                           │    │
│  │ - Agent Card取得                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│      Chat Component          │   │     Canvas Component         │
│   (Message History + Input)  │   │   (A2UI Visualizations)      │
└──────────────┬──────────────┘   └──────────────┬──────────────┘
               │                                  │
               ▼                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         Zustand Store                                │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ chat-store.ts:                                               │    │
│  │ - history: UiMessage[]                                       │    │
│  │ - a2uiSurfaces: Map<string, A2uiSurface>                     │    │
│  │ - contextId, agentCard, partResolvers                        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      A2UI Message Processor                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ - beginRendering → サーフェス作成                            │    │
│  │ - surfaceUpdate → コンポーネント追加                         │    │
│  │ - dataModelUpdate → データモデル更新                         │    │
│  │ - deleteSurface → サーフェス削除                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. State Management (Zustand)

#### Chat Store (`stores/chat-store.ts`)

チャット状態とA2UIサーフェスを管理します。

```typescript
interface ChatState {
  // State
  history: UiMessage[];           // メッセージ履歴
  isA2aStreamOpen: boolean;       // リクエスト中フラグ
  a2uiSurfaces: Map<string, A2uiSurface>;  // A2UIサーフェス
  contextId: string | undefined;  // セッションコンテキスト
  agentCard: AgentCard | null;    // エージェント情報
  partResolvers: PartResolver[];  // パートリゾルバー

  // Actions
  sendMessage: (text: string) => Promise<void>;
  cancelOngoingStream: () => void;
  processA2uiParts: (parts: Part[]) => void;
  clearHistory: () => void;
}
```

**sendMessage Flow:**
```
1. ユーザーメッセージをhistoryに追加（楽観的更新）
2. 空のエージェントメッセージを追加（pending状態）
3. /a2a にPOSTリクエスト（catalog URIs含む）
4. レスポンスからパーツを抽出
5. A2UIパーツを処理（サーフェス更新）
6. 残りのパーツをUiMessageContentに変換
7. エージェントメッセージを更新（completed状態）
```

#### Canvas Store (`stores/canvas-store.ts`)

キャンバスの表示状態を管理します。

```typescript
interface CanvasState {
  surfaceId: string | null;
  contents: AnyComponentNode[] | null;
  openSurfaceInCanvas: (id: string, contents: AnyComponentNode[]) => void;
  closeCanvas: () => void;
}
```

---

### 2. A2UI Message Processing

#### A2uiMessageProcessor (`utils/a2ui-processor.ts`)

A2UIメッセージを処理し、サーフェス状態を管理します。

```typescript
class A2uiMessageProcessor {
  private surfaces: Map<string, A2uiSurface>;

  processMessage(message: A2uiMessage): void {
    if (message.beginRendering) {
      // 新しいサーフェスを作成
      surface.rootComponentId = message.root;
      surface.styles = message.styles;
    }
    if (message.surfaceUpdate) {
      // コンポーネントをサーフェスに追加
      for (const component of message.components) {
        surface.components.set(component.id, component);
      }
    }
    if (message.dataModelUpdate) {
      // パスベースでデータモデルを更新
      this.setDataByPath(surface.dataModel, key, value);
    }
    if (message.deleteSurface) {
      this.surfaces.delete(surfaceId);
    }
  }
}
```

**Data Structures:**
```typescript
interface A2uiSurface {
  surfaceId: string;
  rootComponentId: string | null;
  components: Map<string, A2uiComponent>;
  dataModel: Map<string, unknown>;
  styles: Record<string, string>;
}

interface A2uiComponent {
  id: string;
  component: Record<string, unknown>;
  weight?: string;
}
```

**Path Resolution:**
- ドット記法: `chart.items.0.label`
- ブラケット記法: `chart.items[0].label`
- 混合: `chart.items[0].drillDown[1].value`

---

### 3. Dynamic Rendering System

#### Part Resolution Flow

```
Part (from A2A response)
       │
       ▼
┌─────────────────────────────────────┐
│ Part Resolvers (in order)            │
│ 1. a2uiDataPartResolver              │
│ 2. defaultTextPartResolver           │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ First matching resolver returns      │
│ variant string (e.g., "a2ui_data")   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ UiMessageContent created with        │
│ { data: Part, variant: string }      │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ A2aRenderer looks up variant         │
│ in rendererRegistry                  │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│ Render matching component            │
│ (DefaultTextPart, A2uiDataPart, etc) │
└─────────────────────────────────────┘
```

#### Registry System (`a2a-renderer/registry.ts`)

```typescript
// レンダラー登録
const rendererRegistry = new Map<string, RendererComponent>();

export function registerRenderer(
  variant: string,
  component: RendererComponent
): void {
  rendererRegistry.set(variant, component);
}

// デフォルトリゾルバー
export const DEFAULT_PART_RESOLVERS: PartResolver[] = [
  a2uiDataPartResolver,  // A2UIメッセージを検出
  defaultTextPartResolver // テキストパートを検出
];
```

---

### 4. A2UI Component Rendering

#### A2uiSurfaceRenderer (`a2ui-catalog/A2uiSurface.tsx`)

サーフェスのコンポーネントツリーを再帰的にレンダリングします。

```typescript
function ComponentRenderer({ componentId, surface, dataContextPath }) {
  const componentData = surface.components.get(componentId);
  const componentType = Object.keys(componentDef)[0];
  const properties = componentDef[componentType];

  switch (componentType) {
    case 'Chart':
      return <Chart type={...} title={...} chartData={...} />;
    case 'GoogleMap':
      return <GoogleMap zoom={...} center={...} pins={...} />;
    case 'Canvas':
      return <Box>{resolveChildren(...)}</Box>;
    case 'Column':
      return <Stack direction="column">{children}</Stack>;
    case 'Text':
      return <Typography>{text}</Typography>;
    // ... other components
  }
}
```

**Supported Components:**

| Component | Type | Description |
|-----------|------|-------------|
| `Canvas` | Custom | ルートコンテナ |
| `Chart` | Custom | Chart.js可視化 (pie/doughnut/bar/line) |
| `GoogleMap` | Custom | Google Mapsピン表示 |
| `Column` | Standard | 垂直レイアウト |
| `Row` | Standard | 水平レイアウト |
| `Text` | Standard | テキスト表示 |
| `Card` | Standard | カードコンテナ |
| `List` | Standard | リスト表示 |
| `Divider` | Standard | 区切り線 |
| `Image` | Standard | 画像表示 |

#### Data Binding

プロパティ値はデータモデルにバインドできます。

```typescript
function resolveValue(value, surface, dataContextPath): unknown {
  if (value.literalString) return value.literalString;
  if (value.literalNumber) return value.literalNumber;
  if (value.path) {
    // データモデルからパスで値を取得
    return getDataByPath(surface.dataModel, value.path);
  }
  return value;
}
```

**例:**
```json
{
  "Chart": {
    "title": {"path": "chart.title"},      // データモデル参照
    "chartData": {"path": "chart.items"}   // 配列参照
  }
}
```

---

### 5. Chart Component (`a2ui-catalog/Chart.tsx`)

Chart.jsを使用したインタラクティブなチャート表示。

**Features:**
- **Chart Types**: pie, doughnut, bar, line
- **Drill-down**: カテゴリクリックで詳細表示
- **Data Labels**: パーセンテージ表示
- **Navigation**: 戻るボタンでルートビューに復帰

```typescript
interface ChartDataItem {
  label: string;
  value: number;
  drillDown?: ChartDataItem[];  // ネストされたデータ
}

function Chart({ type, title, chartData }) {
  const [selectedCategory, setSelectedCategory] = useState('root');

  // クリックでドリルダウン
  const onClick = (elements) => {
    if (elements.length > 0 && !isDrillDown) {
      const label = currentData.labels[elements[0].index];
      if (item.drillDown) {
        setSelectedCategory(label);
      }
    }
  };
}
```

---

### 6. GoogleMap Component (`a2ui-catalog/GoogleMap.tsx`)

Google Maps APIを使用したマップ表示。

```typescript
interface MapPin {
  lat: number;
  lng: number;
  name?: string;
  description?: string;
  background?: string;    // ピン背景色
  borderColor?: string;   // ピン枠色
  glyphColor?: string;    // ピングリフ色
}

function GoogleMap({ title, zoom, center, pins }) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ['marker']
  });

  return (
    <GoogleMapComponent center={center} zoom={zoom}>
      {pins.map(pin => (
        <Marker position={{lat: pin.lat, lng: pin.lng}} title={pin.name} />
      ))}
    </GoogleMapComponent>
  );
}
```

---

## Data Flow

### Complete Message Flow

```
User Input (InputArea)
         │
         ▼
┌─────────────────────────────────────────┐
│ chat-store.sendMessage(text)             │
│ 1. Create user UiMessage                 │
│ 2. Create pending agent UiMessage        │
│ 3. Add to history (optimistic)           │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ POST /a2a                                │
│ {                                        │
│   parts: [{kind: 'text', text}],         │
│   context_id: contextId,                 │
│   metadata: {                            │
│     a2uiClientCapabilities: {            │
│       supportedCatalogIds: [...]         │
│     }                                    │
│   }                                      │
│ }                                        │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Express Proxy Server                     │
│ - Forward to agent (localhost:10002)     │
│ - Add X-A2A-Extensions header            │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ Parse Response                           │
│ - Extract parts from Task/Message        │
│ - Handle artifacts                       │
└─────────────────────────────────────────┘
         │
         ├──────────────────┐
         ▼                  ▼
┌─────────────────┐ ┌─────────────────┐
│ Process A2UI    │ │ Convert Parts   │
│ Parts           │ │ to Contents     │
│ (Surfaces)      │ │ (Chat)          │
└─────────────────┘ └─────────────────┘
         │                  │
         ▼                  ▼
┌─────────────────┐ ┌─────────────────┐
│ Canvas renders  │ │ ChatHistory     │
│ A2uiSurface     │ │ renders Message │
└─────────────────┘ └─────────────────┘
```

### A2UI Rendering Flow

```
a2uiSurfaces (from store)
         │
         ▼
┌─────────────────────────────────────────┐
│ Canvas Component                         │
│ - Map over surfaces                      │
│ - Render each in Paper container         │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ A2uiSurfaceRenderer                      │
│ - Get rootComponentId                    │
│ - Start ComponentRenderer recursion      │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│ ComponentRenderer (recursive)            │
│ 1. Get component from surface.components │
│ 2. Determine componentType               │
│ 3. Resolve properties (data binding)     │
│ 4. Render appropriate component          │
│ 5. Recurse for children                  │
└─────────────────────────────────────────┘
         │
         ├────────────────────────────────┐
         ▼                                ▼
┌─────────────────────┐    ┌─────────────────────┐
│ Chart Component     │    │ Standard Components │
│ - resolveChartData  │    │ - Column, Row, Text │
│ - Handle drill-down │    │ - Card, List, etc.  │
└─────────────────────┘    └─────────────────────┘
```

---

## Services

### A2A Service (`services/a2a-service.ts`)

```typescript
const a2aService = {
  async sendMessage(parts, config, signal): Promise<SendMessageSuccessResponse> {
    const response = await fetch('/a2a', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parts,
        context_id: config.contextId,
        metadata: config.supportedCatalogIds
          ? { a2uiClientCapabilities: { supportedCatalogIds } }
          : undefined
      }),
      signal
    });
    return response.json();
  },

  async getAgentCard(baseUrl): Promise<AgentCard> {
    const response = await fetch(`${baseUrl}/a2a/agent-card`);
    return response.json();
  }
};
```

### Catalog Service (`services/catalog-service.ts`)

```typescript
class CatalogService {
  private _catalogUris: string[] = [];

  get catalogUris(): string[] {
    return [...this._catalogUris];
  }

  setCatalogUris(uris: string[]): void {
    this._catalogUris = [...uris];
  }

  addCatalogUri(uri: string): void {
    if (!this._catalogUris.includes(uri)) {
      this._catalogUris.push(uri);
    }
  }
}
```

---

## Type Definitions

### UiMessage Types (`types/ui-message.ts`)

```typescript
interface UiMessage {
  type: 'ui_message';
  id: string;
  contextId: string;
  role: UiAgent | UiUser;
  contents: UiMessageContent[];
  status: 'completed' | 'pending' | 'cancelled';
  created: string;       // ISO 8601
  lastUpdated: string;   // ISO 8601
}

interface UiAgent {
  type: 'ui_agent';
  name: string;
  iconUrl: string;
  subagentName?: string;
}

interface UiUser {
  type: 'ui_user';
}

interface UiMessageContent {
  type: 'ui_message_content';
  id: string;
  data: Part | Artifact;
  variant: string;       // レンダラー選択キー
}
```

### Renderer Types (`types/a2a-renderer.ts`)

```typescript
type PartResolver = (part: Part) => string | null;

type RendererComponent = React.ComponentType<{
  uiMessageContent: UiMessageContent;
}>;

interface RendererComponentProps {
  uiMessageContent: UiMessageContent;
}
```

---

## Configuration

### Environment Variables

```bash
# Google Maps API Key (required for GoogleMap component)
VITE_GOOGLE_MAPS_API_KEY=<your-api-key>
```

### Catalog URIs (App.tsx)

```typescript
const STANDARD_CATALOG_URI =
  'https://raw.githubusercontent.com/google/A2UI/.../standard_catalog_definition.json';

const RIZZCHARTS_CATALOG_URI =
  'https://raw.githubusercontent.com/google/A2UI/.../rizzcharts_catalog_definition.json';

// Initialize on mount
catalogService.setCatalogUris([STANDARD_CATALOG_URI, RIZZCHARTS_CATALOG_URI]);
```

---

## Development

### Scripts

```bash
npm run dev       # Vite開発サーバー + HMR
npm run build     # プロダクションビルド
npm run start     # サーバー + Vite並行起動
npm run server    # Expressプロキシのみ
```

### Build Output

```
dist/
├── index.html
└── assets/
    └── index-[hash].js
```

---

## Extensibility

### Adding Custom Renderers

```typescript
// 1. Create component
function MyCustomPart({ uiMessageContent }: RendererComponentProps) {
  const data = uiMessageContent.data as CustomDataType;
  return <div>{/* render data */}</div>;
}

// 2. Create resolver
const myResolver: PartResolver = (part) => {
  if (part.kind === 'data' && isMyCustomType(part.data)) {
    return 'my_custom_variant';
  }
  return null;
};

// 3. Register
registerRenderer('my_custom_variant', MyCustomPart);
addPartResolver(myResolver, true); // prepend for priority
```

### Adding A2UI Components

```typescript
// In A2uiSurface.tsx ComponentRenderer switch
case 'MyComponent': {
  const prop1 = resolveValue(properties.prop1, surface, dataContextPath);
  return <MyComponent prop1={prop1} />;
}
```

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@a2a-js/sdk` | ^0.3.7 | A2Aプロトコル型定義 |
| `@mui/material` | ^7.3.6 | UIコンポーネント |
| `zustand` | ^5.0.9 | 状態管理 |
| `react` | ^19.2.0 | UIライブラリ |
| `chart.js` | ^4.5.1 | チャート描画 |
| `react-chartjs-2` | ^5.3.1 | Chart.js Reactラッパー |
| `@react-google-maps/api` | ^2.20.8 | Google Maps統合 |
| `react-markdown` | ^10.1.0 | Markdownレンダリング |
| `uuid` | ^13.0.0 | ID生成 |
| `express` | ^5.2.1 | プロキシサーバー |
