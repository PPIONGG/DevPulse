# Draft — Pomodoro Timer

> Status: Draft | ยังไม่ confirm

## มันคืออะไร?

จับเวลาทำงานแบบ Pomodoro Technique — โฟกัสเป็นรอบ (25 นาที) สลับพัก (5 นาที) ครบ 4 รอบพักยาว (15 นาที) พร้อมเก็บสถิติว่าแต่ละวัน/สัปดาห์โฟกัสไปเท่าไหร่

## ทำอะไรได้บ้าง?

### Timer
- Start / Pause / Resume / Reset
- กด Skip ข้ามไป break หรือข้าม break กลับมาทำงานได้
- พอหมดเวลาแจ้งเตือนผ่าน Browser Notification
- ใส่ label ได้ว่ากำลังทำอะไรอยู่ (optional)
- แสดง session dots บอกว่าทำไปกี่รอบแล้ว (เช่น ●●○○ = 2/4)

### ตั้งค่า
- ปรับเวลา work / break / long break ได้
- ปรับจำนวนรอบก่อน long break ได้
- เลือกว่า break เริ่มอัตโนมัติไหม
- Config เก็บใน localStorage (ไม่ต้องเข้า DB, เป็น per-device)

### สถิติ
- วันนี้: กี่ session / กี่นาที
- สัปดาห์นี้: กี่ session / กี่นาที
- Streak: ทำติดต่อกันกี่วัน

### ประวัติ
- ดูรายการ session ที่ทำเสร็จ จัดกลุ่มตามวัน
- แต่ละ entry แสดง: label, ระยะเวลา, เวลาที่ทำเสร็จ
- ลบทีละอัน หรือ Clear All ได้

## หน้าตา UI

```
┌──────────────────────────────────────────────────┐
│ Pomodoro Timer                        [⚙ Settings]│
├──────────────────────────────────────────────────┤
│                                                  │
│              ╭─────────────╮                     │
│              │             │                     │
│              │    24:37    │   ← วงกลม progress  │
│              │    Focus    │      ring           │
│              │             │                     │
│              ╰─────────────╯                     │
│              ●●○○  (2/4)                         │
│                                                  │
│         [  Fix auth bug...  ]   ← task label     │
│                                                  │
│          [▶ Start]  [↺ Reset]                    │
│                                                  │
├──────────────────────────────────────────────────┤
│  Today          This Week        Streak          │
│  4 sessions     12 sessions      5 days          │
│  100 min        300 min                          │
├──────────────────────────────────────────────────┤
│ Session History                    [Clear All]   │
│ ─── Today ───                                    │
│  Fix auth bug           25 min      2:30 PM      │
│  Fix auth bug           25 min      2:00 PM      │
│ ─── Yesterday ───                                │
│  API refactor           25 min      4:00 PM      │
└──────────────────────────────────────────────────┘
```

## Navigation

- Icon: `Timer` (lucide-react)
- Path: `/pomodoro`

## คำถาม / สิ่งที่ต้องตัดสินใจ

- [ ] ต้องการเสียงแจ้งเตือนด้วยไหม หรือแค่ Browser Notification พอ?
- [ ] อยากให้ผูกกับ Kanban task ได้ไหม? (เช่น เลือก task แล้วจับเวลา)
- [ ] Stats อยากเห็นกราฟไหม? หรือแค่ตัวเลขพอ?
- [ ] session history ต้องการ filter ตามวันไหม?

## npm Packages

ไม่ต้องติดตั้งเพิ่ม
