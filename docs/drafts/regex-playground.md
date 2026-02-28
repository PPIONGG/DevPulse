# Draft — Regex Playground

> Status: Draft | ยังไม่ confirm

## มันคืออะไร?

เครื่องมือทดสอบ Regular Expression แบบ interactive — พิมพ์ pattern กับ test string แล้วเห็น match highlight ทันที พร้อม save pattern ที่ใช้บ่อยเป็น library ส่วนตัว

## ทำอะไรได้บ้าง?

### Regex Tester (ส่วนหลัก)
- พิมพ์ regex pattern → เห็นผลทันที (real-time)
- เลือก flags ได้: g (global), i (case-insensitive), m (multiline), s (dotall), u (unicode)
- ใส่ test string แล้ว match จะ highlight เป็นสีเหลือง
- แสดงจำนวน match: "3 matches found"
- แสดงรายละเอียดแต่ละ match: ค่า, ตำแหน่ง, capture groups
- ถ้า pattern ผิด แสดง error message สีแดง
- กด Copy Regex ได้

### Saved Patterns
- กด Save เก็บ pattern ที่ใช้บ่อย (พร้อม title, description, tags)
- Click pattern ที่ save ไว้ → โหลดกลับเข้า tester
- Favorite ได้
- ค้นหา / filter ตาม tag

### Cheat Sheet
- แผ่นสรุป regex syntax เปิดดูได้ (collapsible)
- แบ่งหมวด: Character Classes, Quantifiers, Anchors, Groups, Flags
- Common patterns สำเร็จรูป: Email, URL, IP, Date, Hex Color, Phone
  - กดแล้วโหลดเข้า tester ได้เลย

## หน้าตา UI

### Tester Section (ส่วนบน)

```
┌────────────────────────────────────────────────────────┐
│ Regex Playground                      [Cheat Sheet ▼]  │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Pattern:  / ^(\d{3})-(\d{3})-(\d{4})$            /   │
│                                                        │
│  Flags:    [g] [i] [ m ] [ s ] [ u ]                  │
│             ↑active       ↑inactive                    │
│                                                        │
│  Test String:                                          │
│  ┌──────────────────────────────────────────────┐      │
│  │ Call me at [123-456-7890] or [098-765-4321]  │      │
│  │ My old number was [555-123-4567]             │      │
│  │              ↑ highlighted matches           │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
│  3 matches found           [Save] [Copy Regex] [Clear] │
│                                                        │
│  Match Details:                                        │
│  ┌──────────────────────────────────────────────┐      │
│  │ Match 1: "123-456-7890"  (index 11)          │      │
│  │   Group 1: "123"                             │      │
│  │   Group 2: "456"                             │      │
│  │   Group 3: "7890"                            │      │
│  │ Match 2: "098-765-4321"  (index 27)          │      │
│  │   Group 1: "098"   ...                       │      │
│  └──────────────────────────────────────────────┘      │
│                                                        │
├────────────────────────────────────────────────────────┤
│ Saved Patterns                        [Search...]      │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│ │ Email Valid.  │ │ URL Parser   │ │ Date Format  │    │
│ │ /^[\w-]+@.+/ │ │ /https?:\/\/ │ │ /\d{4}-\d{2} │    │
│ │ [gi]     ★   │ │ [g]          │ │ [g]          │    │
│ └──────────────┘ └──────────────┘ └──────────────┘    │
└────────────────────────────────────────────────────────┘
```

### Cheat Sheet (เปิดเป็น sheet หรือ collapsible panel)

```
┌────────────────────────────────────┐
│ Regex Cheat Sheet            [✕]  │
├────────────────────────────────────┤
│ Character Classes                  │
│   .     Any character              │
│   \d    Digit [0-9]                │
│   \w    Word char [a-zA-Z0-9_]     │
│   \s    Whitespace                 │
│   ...                              │
│                                    │
│ Quantifiers                        │
│   *     0 or more                  │
│   +     1 or more                  │
│   ?     0 or 1                     │
│   {n,m} Between n and m           │
│                                    │
│ Common Patterns        [Use ▶]    │
│   Email    /^[\w.-]+@[\w.-]+/      │
│   URL      /https?:\/\/[\w-]+/     │
│   IPv4     /\b\d{1,3}\.\d{1,3}/   │
└────────────────────────────────────┘
```

## Navigation

- Icon: `Regex` (lucide-react)
- Path: `/regex`

## คำถาม / สิ่งที่ต้องตัดสินใจ

- [ ] Cheat sheet เปิดแบบไหน? side sheet / collapsible section / tab แยก?
- [ ] อยากให้มี "Replace" mode ด้วยไหม? (ใส่ replace string แล้วเห็นผลลัพธ์)
- [ ] Common patterns preset ต้องการให้ load เข้า tester ได้เลย หรือแค่แสดงให้ดู?
- [ ] Saved patterns อยากจัดกลุ่มเป็น folder/tag ไหม?
- [ ] อยากได้ share pattern (public) เหมือน snippets ไหม?

## npm Packages

ไม่ต้องติดตั้งเพิ่ม — ใช้ browser `RegExp` ที่มีอยู่แล้ว
