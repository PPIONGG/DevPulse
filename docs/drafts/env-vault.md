# Draft — Environment Variable Vault

> Status: Draft | ยังไม่ confirm

## มันคืออะไร?

ที่เก็บ environment variables จัดเป็นชุดตามโปรเจคและ environment (dev/staging/prod) — แก้ปัญหาเรื่องหา env vars ไม่เจอ ก็อปผิดชุด ลืมว่าค่าอะไร เป็น dev tool สำหรับ developer โดยเฉพาะ

## ทำอะไรได้บ้าง?

### Vault (ชุด env)
- สร้าง vault ได้หลายอัน (เช่น "My SaaS App", "Side Project")
- แต่ละ vault เลือก environment ได้: Development, Staging, Production, Custom
- ใส่ description ได้
- Favorite ได้

### Variables (key-value)
- เพิ่ม key-value ทีละตัว
- แก้ไข inline ได้เลย (click ที่ key หรือ value)
- ลบทีละตัว
- ค่าที่เป็น secret จะ mask เป็น `••••••••` โดย default
- กด eye icon เพื่อ reveal ทีละตัว หรือ "Reveal All" ทั้ง vault
- key ห้ามซ้ำกันภายใน vault เดียวกัน

### Import / Export
- **Import**: paste `.env` text แล้วระบบ parse ให้อัตโนมัติ (แสดง preview ก่อน import)
- **Copy All**: กดปุ่มเดียว copy ทั้ง vault เป็น `.env` format ใส่ clipboard
- **Export**: download เป็นไฟล์ `.env`

### Filter / Search
- ค้นหาตามชื่อ vault
- filter ตาม environment
- filter เฉพาะ favorites

## หน้าตา UI

### มุมมอง Vault List

```
┌────────────────────────────────────────────────────┐
│ Env Vault                           [+ New Vault]  │
├────────────────────────────────────────────────────┤
│ [Search...]  [All Envs ▼]  [★ Favorites]          │
├────────────────────────────────────────────────────┤
│ ┌────────────────────┐ ┌────────────────────┐     │
│ │ My SaaS App        │ │ Side Project       │     │
│ │ [Production] ★     │ │ [Development]      │     │
│ │ Main API keys...   │ │ Local dev setup    │     │
│ │ 12 variables       │ │ 5 variables        │     │
│ └────────────────────┘ └────────────────────┘     │
└────────────────────────────────────────────────────┘
```

### มุมมอง Vault Detail (expand หรือ click เข้าไป)

```
┌────────────────────────────────────────────────────┐
│ My SaaS App  [Production]                          │
│ [+ Add Variable] [Import .env] [Copy All] [Export] │
│ [Reveal All]                                       │
│ ──────────────────────────────────────────────     │
│  DATABASE_URL    = ••••••••••••••••     👁  🗑    │
│  API_KEY         = ••••••••••••••••     👁  🗑    │
│  STRIPE_SECRET   = ••••••••••••••••     👁  🗑    │
│  REDIS_URL       = redis://localhost   👁  🗑    │
│  DEBUG           = true                👁  🗑    │
└────────────────────────────────────────────────────┘
```

### Environment Badge สี

| Environment | สี |
|---|---|
| Development | น้ำเงิน |
| Staging | เหลือง |
| Production | แดง |
| Custom | เทา |

## Navigation

- Icon: `KeyRound` (lucide-react)
- Path: `/env-vault`

## คำถาม / สิ่งที่ต้องตัดสินใจ

- [ ] Vault detail เปิดแบบไหน? expand inline / sheet ด้านข้าง / เข้าหน้าใหม่?
- [ ] อยากให้ encrypt value ใน DB ไหม? หรือเก็บ plain text พอ (เป็น personal tool)?
- [ ] ต้องการ duplicate vault ได้ไหม? (เช่น clone dev → staging)
- [ ] ต้องการ variable ordering แบบ drag-and-drop ไหม? หรือเรียงตาม key alphabetically?
- [ ] ต้องการ version history ไหม? (เห็นว่าค่าเคยเปลี่ยนจากอะไรเป็นอะไร)

## npm Packages

ไม่ต้องติดตั้งเพิ่ม
