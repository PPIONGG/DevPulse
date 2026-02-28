# Draft — JSON Tools

> Status: Draft | ยังไม่ confirm

## มันคืออะไร?

ชุดเครื่องมือสำหรับทำงานกับ JSON และ YAML — format ให้สวย, ย่อให้เล็ก, validate, แปลงไปมาระหว่าง JSON กับ YAML, เทียบ diff 2 ไฟล์, และดูโครงสร้างเป็น tree เป็นเครื่องมือที่ dev ใช้ทุกวันอยู่แล้ว

## ทำอะไรได้บ้าง?

### Tab 1: Format / Validate
- Paste JSON เข้ามา → กด Format ให้สวย (prettify)
- กด Minify ให้เหลือบรรทัดเดียว
- เลือก indent ได้: 2 spaces / 4 spaces / tab
- Validate: ถ้า JSON ผิด บอก error พร้อมบรรทัดที่ผิด
- Auto-detect ว่าเป็น JSON หรือ YAML
- Copy ผลลัพธ์ได้

### Tab 2: Convert (JSON ↔ YAML)
- ใส่ JSON → ได้ YAML
- ใส่ YAML → ได้ JSON
- สลับทิศทางได้
- Copy ผลลัพธ์ได้

### Tab 3: Diff
- ใส่ JSON 2 ชุด เทียบกัน side-by-side
- เห็นความแตกต่าง:
  - เพิ่ม (สีเขียว)
  - ลบ (สีแดง)
  - เปลี่ยน (สีเหลือง)
- บอกสรุป: "3 additions, 2 removals, 1 change"
- เลือกเทียบแบบ structural (sort keys) หรือ literal ได้

### Tab 4: Tree View
- ใส่ JSON → แสดงเป็น tree ที่กดขยาย/ยุบได้
- แต่ละ node บอก: key, type (string/number/boolean/null/array/object), value
- Array บอกจำนวน: `items (3)`
- Object บอกจำนวน key: `config {5}`
- สีตาม type: string=เขียว, number=น้ำเงิน, boolean=ม่วง, null=เทา

### Saved Documents
- Save JSON/YAML ที่ใช้บ่อย (ใส่ title, description, tags)
- Click → โหลดเข้า editor
- Favorite ได้
- ค้นหาตาม title / tag

## หน้าตา UI

### Format Tab

```
┌──────────────────────────────────────────────────────────┐
│ JSON Tools                                [Save Current] │
├──────────────────────────────────────────────────────────┤
│ [Format] [Convert] [Diff] [Tree]                         │
├──────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐  ┌──────────────────────┐      │
│ │ Input                │  │ Output          [📋] │      │
│ │                      │  │                      │      │
│ │ {"name":"John",      │  │ {                    │      │
│ │ "age":30,"city":     │  │   "name": "John",   │      │
│ │ "New York"}          │  │   "age": 30,         │      │
│ │                      │  │   "city": "New York" │      │
│ │                      │  │ }                    │      │
│ └──────────────────────┘  └──────────────────────┘      │
│                                                          │
│ Indent: (2) (4) (Tab)     ✅ Valid JSON                  │
│ [Format] [Minify] [Validate]                             │
└──────────────────────────────────────────────────────────┘
```

### Convert Tab

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐      │
│ │ JSON                 │  │ YAML            [📋] │      │
│ │                      │  │                      │      │
│ │ {                    │  │ server:              │      │
│ │   "server": {        │→→│   host: localhost    │      │
│ │     "host": "local", │  │   port: 8080         │      │
│ │     "port": 8080     │  │                      │      │
│ │   }                  │  │                      │      │
│ │ }                    │  │                      │      │
│ └──────────────────────┘  └──────────────────────┘      │
│                                                          │
│              [⇄ Swap Direction]                          │
└──────────────────────────────────────────────────────────┘
```

### Diff Tab

```
┌──────────────────────────────────────────────────────────┐
│ ┌──────────────────────┐  ┌──────────────────────┐      │
│ │ Original             │  │ Modified             │      │
│ │                      │  │                      │      │
│ │ {                    │  │ {                    │      │
│ │   "name": "John",   │  │   "name": "Jane",   │ ← เปลี่ยน │
│ │   "age": 30,        │  │   "age": 25,         │ ← เปลี่ยน │
│ │   "city": "NY"      │  │   "city": "NY",      │      │
│ │                      │  │   "email": "j@x.com" │ ← เพิ่ม │
│ │ }                    │  │ }                    │      │
│ └──────────────────────┘  └──────────────────────┘      │
│                                                          │
│ 2 changed, 1 added, 0 removed                           │
└──────────────────────────────────────────────────────────┘
```

### Tree Tab

```
┌──────────────────────────────────────────────────────────┐
│ Input: [paste JSON here...]                              │
│                                                          │
│ ▼ root {3}                                               │
│   ├─ name: "John"                  ← สีเขียว (string)   │
│   ├─ age: 30                       ← สีน้ำเงิน (number) │
│   └─▼ address {2}                                        │
│      ├─ city: "NY"                                       │
│      └─ zip: null                  ← สีเทา (null)       │
└──────────────────────────────────────────────────────────┘
```

### Saved Documents (ส่วนล่าง ทุก tab)

```
├──────────────────────────────────────────────────────────┤
│ Saved Documents                    [Search...]  [★ Fav]  │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐      │
│ │ API Response  │ │ Config File  │ │ Sample Data  │      │
│ │ [JSON]        │ │ [YAML]       │ │ [JSON]   ★   │      │
│ │ {"users":...  │ │ server:...   │ │ [{"id":1...  │      │
│ └──────────────┘ └──────────────┘ └──────────────┘      │
└──────────────────────────────────────────────────────────┘
```

## Navigation

- Icon: `Braces` (lucide-react)
- Path: `/json-tools`

## คำถาม / สิ่งที่ต้องตัดสินใจ

- [ ] ต้องการ tab ทั้ง 4 เลยไหม? หรือเริ่มแค่ Format + Convert ก่อน?
- [ ] Diff ต้องการเทียบแบบ line-by-line (text diff) หรือ structural (deep compare) หรือทั้งสอง?
- [ ] Tree view ต้องการ edit ค่าได้ไหม? หรือแค่ดูอย่างเดียว?
- [ ] ต้องการ JSON Schema validation ด้วยไหม? (ใส่ schema แล้ว validate ว่า data ตรง schema ไหม)
- [ ] Output อยากใช้ syntax highlighting (Shiki) ไหม? หรือ monospace textarea ธรรมดาพอ?
- [ ] Saved documents ต้องการ share (public) เหมือน snippets ไหม?

## npm Packages

- `js-yaml` — สำหรับ JSON ↔ YAML conversion (tab Convert)
