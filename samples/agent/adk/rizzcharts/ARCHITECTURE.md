# Rizzcharts Agent - Architecture Documentation

## Overview

Rizzcharts Agent は、A2UI (Agent-to-UI) プロトコルを使用して動的なUIを生成するeコマースダッシュボードエージェントです。Google ADK (Agent Development Kit) と A2A (Agent-to-Agent) プロトコルを基盤として構築されています。

## Directory Structure

```
rizzcharts/
├── __init__.py                          # パッケージ初期化
├── __main__.py                          # サーバーエントリーポイント (CLI)
├── .env                                 # 環境変数 (API keys)
├── pyproject.toml                       # 依存関係定義
│
├── Core Implementation:
├── agent.py                             # メインエージェントロジック
├── agent_executor.py                    # A2A実行とセッション管理
├── a2ui_toolset.py                      # A2UIツール実装
├── a2ui_session_util.py                 # セッション状態キー定義
├── tools.py                             # データソースツール
├── part_converter.py                    # A2UIメッセージ変換
├── component_catalog_builder.py         # カタログ読み込み
├── rizzcharts_catalog_definition.json  # カスタムコンポーネント定義
│
└── examples/                            # A2UIメッセージテンプレート
    ├── rizzcharts_catalog/
    │   ├── chart.json                   # チャートテンプレート
    │   └── map.json                     # マップテンプレート
    └── standard_catalog/
        ├── chart.json
        └── map.json
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client (React)                              │
│                    POST /a2a + GET /agent-card                       │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    A2A Server (__main__.py)                          │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Starlette Application                                        │    │
│  │ - DefaultRequestHandler                                      │    │
│  │ - InMemoryTaskStore                                          │    │
│  │ - CORS Middleware (localhost:5173)                           │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│              RizzchartsAgentExecutor (agent_executor.py)             │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Session Preparation:                                         │    │
│  │ - A2UI Extension Activation                                  │    │
│  │ - Schema + Catalog Loading                                   │    │
│  │ - Client Capability Detection                                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ ComponentCatalogBuilder:                                     │    │
│  │ - Standard Catalog ←→ Rizzcharts Catalog                     │    │
│  │ - Schema Merging                                             │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   rizzchartsAgent (agent.py)                         │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ LlmAgent (Gemini 2.5 Flash)                                  │    │
│  │ - System Instructions (A2UI workflow + schema + examples)    │    │
│  │ - Tools: get_sales_data, get_store_sales, A2uiToolset        │    │
│  └─────────────────────────────────────────────────────────────┘    │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
┌─────────────────────────────┐   ┌─────────────────────────────┐
│    Data Tools (tools.py)    │   │ A2uiToolset (a2ui_toolset.py)│
│ - get_sales_data()          │   │ - send_a2ui_json_to_client  │
│ - get_store_sales()         │   │ - JSON Schema Validation    │
│ Returns: sales data         │   │ Returns: A2UI Parts         │
└─────────────────────────────┘   └──────────────┬──────────────┘
                                                  │
                                                  ▼
                                  ┌─────────────────────────────┐
                                  │ A2uiPartConverter           │
                                  │ (part_converter.py)         │
                                  │ - GenAI → A2A Part          │
                                  │ - A2UI Part Creation        │
                                  └─────────────────────────────┘
```

---

## Core Components

### 1. Server Entry Point (`__main__.py`)

サーバーの起動とA2Aアプリケーションの設定を担当します。

```python
# 主要な処理フロー
1. Click CLI でホスト/ポート設定を受け取る
2. 環境変数からGemini APIキーを検証
3. RizzchartsAgentExecutorインスタンスを作成
4. A2A Starletteアプリケーションをビルド
5. CORSミドルウェアを設定
6. Uvicornサーバーを起動
```

**設定オプション:**
- `--host`: バインドアドレス (default: localhost)
- `--port`: ポート番号 (default: 10002)

### 2. Agent Executor (`agent_executor.py`)

A2Aプロトコルのハンドリングとセッション管理を行います。

**Agent Card Definition:**
```python
{
    "name": "Ecommerce Dashboard Agent",
    "description": "Visualizes ecommerce data...",
    "capabilities": {
        "extensions": [A2UI Extension],
        "streaming": True
    },
    "skills": [
        "view_sales_by_category",  # 売上カテゴリ別可視化
        "view_regional_outliers"   # 地域外れ値マップ
    ]
}
```

**Session Preparation Flow:**
```
1. クライアントのA2UI対応を確認
2. サポートするカタログURIを取得
3. 適切なカタログ（Rizzcharts / Standard）を選択
4. A2UIスキーマをロード
5. セッション状態に保存:
   - A2UI_ENABLED_STATE_KEY
   - A2UI_SCHEMA_STATE_KEY
   - A2UI_CATALOG_URI_STATE_KEY
```

### 3. Agent Logic (`agent.py`)

LLMエージェントのコア実装です。

**Class: `rizzchartsAgent`**

```python
@classmethod
def build_agent(cls):
    return LlmAgent(
        model="litellm/gemini/gemini-2.5-flash",
        name="rizzcharts_agent",
        tools=[get_store_sales, get_sales_data, A2uiToolset()],
        planner=BuiltInPlanner(thinking=True),
        disallow_transfer_to_peers=True
    )
```

**System Instructions構成:**
1. エージェントロール定義（A2UI Ecommerce Dashboard Analyst）
2. A2UIスキーマ全文
3. テンプレート例（Chart/Map JSON）
4. ワークフロー指示:
   - リクエスト分析 → データ取得 → テンプレート選択 → JSON構築 → ツール呼び出し

### 4. A2UI Toolset (`a2ui_toolset.py`)

A2UI JSONをクライアントに送信するツールを提供します。

**Tool: `send_a2ui_json_to_client`**

```python
class SendA2uiJsonToClientTool(BaseTool):
    """
    A2UI JSONをクライアントに送信し、
    リッチUIをレンダリングさせる
    """

    async def run_async(self, args, tool_context):
        # 1. JSON文字列をパース
        # 2. A2UIスキーマに対して検証
        # 3. skip_summarization=True を設定
        # 4. 成功時はNoneを返す
```

**動的ツールリスト:**
- A2UIが有効な場合のみツールを返す
- セッション状態でA2UI有効/無効を判定

### 5. Data Tools (`tools.py`)

エージェントが使用するデータソースツールです。

```python
def get_sales_data():
    """カテゴリ別売上データを返す"""
    return {
        "sales_data": [
            {"label": "Apparel", "value": 41, "drillDown": [...]},
            {"label": "Electronics", "value": 28, "drillDown": [...]},
            ...
        ]
    }

def get_store_sales():
    """店舗別売上データを返す（地図用）"""
    return {
        "store_sales": [
            {"store_name": "Downtown LA", "lat": 34.0522, "lng": -118.2437, ...},
            ...
        ]
    }
```

### 6. Part Converter (`part_converter.py`)

GenAI SDKのパーツをA2Aプロトコルのパーツに変換します。

```python
class A2uiPartConverter:
    def convert_genai_part_to_a2a_part(self, part):
        if is_function_call_to_send_a2ui:
            # JSON文字列をパース
            # 各A2UIメッセージをA2A Partに変換
            return [create_a2ui_part(msg) for msg in messages]
        elif is_function_response:
            # 内部レスポンスは送信しない
            return []
        else:
            # デフォルトコンバーターを使用
            return default_converter(part)
```

### 7. Component Catalog Builder (`component_catalog_builder.py`)

カタログ定義をロードし、スキーマにマージします。

**Catalog Selection Logic:**
```
1. クライアントがサポートするカタログURIを確認
2. Rizzchartsカタログが含まれていれば優先
3. なければStandardカタログを使用
4. カタログ定義をスキーマにマージ
```

---

## A2UI Message Structure

A2UIメッセージは3種類のメッセージタイプから構成されます。

### 1. Begin Rendering

新しいUIサーフェスを初期化します。

```json
{
  "beginRendering": {
    "surfaceId": "sales_breakdown_q4_surface",
    "root": "root-canvas",
    "styles": {
      "primaryColor": "#1976d2",
      "font": "Roboto"
    }
  }
}
```

### 2. Surface Update

コンポーネント階層を定義します。

```json
{
  "surfaceUpdate": {
    "surfaceId": "sales_breakdown_q4_surface",
    "components": [
      {
        "id": "root-canvas",
        "component": {
          "Canvas": {
            "children": {"explicitList": ["chart-container"]}
          }
        }
      },
      {
        "id": "sales-chart",
        "component": {
          "Chart": {
            "type": "doughnut",
            "title": {"path": "chart.title"},
            "chartData": {"path": "chart.items"}
          }
        }
      }
    ]
  }
}
```

### 3. Data Model Update

データモデルを設定します。

```json
{
  "dataModelUpdate": {
    "surfaceId": "sales_breakdown_q4_surface",
    "path": "/",
    "contents": [
      {"key": "chart.title", "valueString": "Q4 Sales"},
      {"key": "chart.items[0].label", "valueString": "Apparel"},
      {"key": "chart.items[0].value", "valueNumber": 41},
      {"key": "chart.items[0].drillDown[0].label", "valueString": "Tops"}
    ]
  }
}
```

---

## Rizzcharts Custom Catalog

Rizzchartsカタログは、標準カタログを拡張したカスタムコンポーネントを定義します。

### Canvas Component

```json
{
  "Canvas": {
    "description": "Renders UI in a stateful panel next to chat",
    "properties": {
      "children": {
        "explicitList": ["array of component IDs"]
      }
    }
  }
}
```

### Chart Component

```json
{
  "Chart": {
    "description": "Interactive hierarchical chart",
    "properties": {
      "type": "enum: [doughnut, pie]",
      "title": "literalString | path",
      "chartData": {
        "items": [
          {
            "label": "string",
            "value": "number",
            "drillDown": [{"label", "value"}]
          }
        ]
      }
    }
  }
}
```

### GoogleMap Component

```json
{
  "GoogleMap": {
    "description": "Interactive map with pins",
    "properties": {
      "center": {"lat": "number", "lng": "number"},
      "zoom": "number",
      "pins": [
        {
          "lat": "number",
          "lng": "number",
          "name": "string",
          "description": "string",
          "background": "#hex",
          "borderColor": "#hex",
          "glyphColor": "#hex"
        }
      ]
    }
  }
}
```

---

## Message Generation Workflow

```
User: "Show Q4 sales breakdown by category"
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 1. Intent Analysis                       │
│    → Chart visualization required        │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 2. Data Fetching                         │
│    → Call get_sales_data()               │
│    → Returns categories + drillDown      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 3. Template Selection                    │
│    → Use rizzcharts_catalog/chart.json   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 4. JSON Construction                     │
│    → Generate unique surfaceId           │
│    → Update title Text component         │
│    → Populate dataModelUpdate            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│ 5. Tool Invocation                       │
│    → send_a2ui_json_to_client(json)      │
│    → Schema validation                   │
│    → Part conversion                     │
└─────────────────────────────────────────┘
                    │
                    ▼
           A2A Response to Client
```

---

## Dependencies

| Package | Version | Role |
|---------|---------|------|
| `a2a-sdk` | >=0.3.0 | A2Aプロトコル実装 |
| `google-adk` | >=1.8.0 | Agent Development Kit |
| `google-genai` | >=1.27.0 | Gemini API SDK |
| `litellm` | latest | LLMルーター |
| `jsonschema` | >=4.0.0 | JSONスキーマ検証 |
| `a2ui` | latest | A2UI拡張ライブラリ |
| `click` | >=8.1.8 | CLIフレームワーク |
| `python-dotenv` | >=1.1.0 | 環境変数読み込み |

---

## Environment Configuration

```bash
# Required
GEMINI_API_KEY=<your-api-key>

# Optional
LITELLM_MODEL=gemini/gemini-2.5-flash
GOOGLE_GENAI_USE_VERTEXAI=TRUE  # Vertex AI使用時
```

---

## Running the Agent

```bash
cd samples/agent/adk/rizzcharts
uv run .

# Options
uv run . --host 0.0.0.0 --port 8080
```

---

## Security Considerations

1. **入力検証**: すべてのA2UI JSONはスキーマに対して検証される
2. **データソース**: 静的なデモデータを使用（外部API/DBなし）
3. **クライアント側の注意**:
   - A2UIデータは信頼できないものとして扱う
   - XSS対策、CSPポリシーの適用が必要
   - プロンプトインジェクション対策
