-- Add Thai content columns to SQL Practice and Academy

-- SQL Challenges
ALTER TABLE sql_challenges ADD COLUMN IF NOT EXISTS title_th TEXT;
ALTER TABLE sql_challenges ADD COLUMN IF NOT EXISTS description_th TEXT;
ALTER TABLE sql_challenges ADD COLUMN IF NOT EXISTS hint_th TEXT;

-- SQL Lessons
ALTER TABLE sql_lessons ADD COLUMN IF NOT EXISTS module_title_th TEXT;
ALTER TABLE sql_lessons ADD COLUMN IF NOT EXISTS title_th TEXT;
ALTER TABLE sql_lessons ADD COLUMN IF NOT EXISTS description_th TEXT;
ALTER TABLE sql_lessons ADD COLUMN IF NOT EXISTS content_th TEXT;

-- Seed some Thai content for the first few challenges
UPDATE sql_challenges SET 
    title_th = 'เลือกพนักงานทั้งหมด',
    description_th = 'เขียนคำสั่ง SQL เพื่อดึงข้อมูลทุกคอลัมน์และทุกแถวจากตาราง `employees` (พนักงาน)',
    hint_th = 'ใช้ SELECT * เพื่อเลือกทุกคอลัมน์'
WHERE slug = 'select-all-employees';

UPDATE sql_challenges SET 
    title_th = 'ชื่อพนักงานและเงินเดือน',
    description_th = 'เขียนคำสั่ง SQL เพื่อดึงเฉพาะคอลัมน์ `first_name`, `last_name`, และ `salary` จากตาราง `employees` (พนักงาน)',
    hint_th = 'ระบุชื่อคอลัมน์ที่ต้องการโดยคั่นด้วยเครื่องหมายจุลภาค (comma)'
WHERE slug = 'employee-names-and-salaries';

UPDATE sql_challenges SET 
    title_th = 'แผนกที่แตกต่างกัน',
    description_th = 'เขียนคำสั่ง SQL เพื่อดึงค่า `department_id` ที่ไม่ซ้ำกันทั้งหมดจากตาราง `employees` โดยให้คอลัมน์ผลลัพธ์ชื่อว่า `department_id` เหมือนเดิม',
    hint_th = 'ใช้คีย์เวิร์ด DISTINCT หลังคำสั่ง SELECT'
WHERE slug = 'unique-departments';

-- Seed some Thai content for initial lessons
UPDATE sql_lessons SET 
    module_title_th = '1. พื้นฐานข้อมูล',
    title_th = 'SQL คืออะไร?',
    description_th = 'เรียนรู้ว่า SQL คืออะไรและทำไมมันถึงเป็นภาษาของข้อมูล',
    content_th = 'SQL ย่อมาจาก **Structured Query Language** ใช้สำหรับการสื่อสารกับฐานข้อมูล ลองนึกถึงฐานข้อมูลเหมือนไฟล์ Excel ขนาดใหญ่ที่มีหลายแผ่น (เราเรียกว่า **ตาราง** หรือ **Tables**)

ในบทเรียนนี้ คุณจะได้เรียนรู้คำสั่งแรก: `SELECT`.

`SELECT` ใช้สำหรับเลือกว่าจะดูคอลัมน์ไหน
`FROM` บอกฐานข้อมูลว่าจะให้ไปดูที่ตารางไหน

**ลองทำดู:** เลือกข้อมูลทั้งหมดจากตาราง `users`.'
WHERE id = 'intro-to-sql';

UPDATE sql_lessons SET 
    module_title_th = '1. พื้นฐานข้อมูล',
    title_th = 'การเลือกเฉพาะคอลัมน์',
    description_th = 'วิธีเลือกเฉพาะข้อมูลที่คุณต้องการ',
    content_th = 'การใช้ `*` จะดึงมาทุกคอลัมน์ แต่ปกติเราต้องการแค่บางส่วนเท่านั้น ให้ระบุชื่อคอลัมน์ที่ต้องการแล้วคั่นด้วยเครื่องหมายจุลภาค

ตัวอย่าง: `SELECT name, email FROM users;` 

**ลองทำดู:** เลือกเฉพาะ `username` และ `display_name` จากตาราง `users`.'
WHERE id = 'selecting-columns';
