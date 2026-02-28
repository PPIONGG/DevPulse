"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Copy, Check, Hash, Filter, Database, Link as LinkIcon, Zap, Layers, Grid, Edit3, Settings, ShieldCheck, Type, Calendar } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface CheatItem {
  title: string;
  syntax: string;
  description: string;
  example: string;
}

interface CheatCategory {
  category: string;
  icon: any;
  items: CheatItem[];
}

const cheatSheetData: CheatCategory[] = [
  {
    category: "Basics & Selection",
    icon: Database,
    items: [
      {
        title: "SELECT ALL",
        syntax: "SELECT * FROM table_name;",
        description: "ดึงข้อมูลทุกคอลัมน์จากตาราง",
        example: "SELECT * FROM employees;"
      },
      {
        title: "SELECT COLUMNS",
        syntax: "SELECT col1, col2 FROM table;",
        description: "เลือกเฉพาะคอลัมน์ที่ต้องการ",
        example: "SELECT name, salary FROM employees;"
      },
      {
        title: "SELECT DISTINCT",
        syntax: "SELECT DISTINCT column FROM table;",
        description: "ดึงเฉพาะค่าที่ไม่ซ้ำกัน (Unique)",
        example: "SELECT DISTINCT department FROM employees;"
      },
      {
        title: "ORDER BY",
        syntax: "SELECT * FROM table ORDER BY col ASC|DESC;",
        description: "จัดเรียงข้อมูล (น้อยไปมาก หรือ มากไปน้อย)",
        example: "SELECT * FROM users ORDER BY created_at DESC;"
      },
      {
        title: "LIMIT & OFFSET",
        syntax: "SELECT * FROM table LIMIT 10 OFFSET 5;",
        description: "จำกัดจำนวนแถวและข้ามแถวเริ่มต้น",
        example: "SELECT * FROM products LIMIT 5 OFFSET 10;"
      }
    ]
  },
  {
    category: "Filtering (WHERE)",
    icon: Filter,
    items: [
      {
        title: "WHERE CLAUSE",
        syntax: "SELECT * FROM table WHERE condition;",
        description: "กรองข้อมูลตามเงื่อนไข",
        example: "SELECT * FROM users WHERE age >= 18;"
      },
      {
        title: "LIKE & Wildcards",
        syntax: "WHERE column LIKE 'A%';",
        description: "ค้นหาข้อความ (% = หลายตัว, _ = หนึ่งตัว)",
        example: "SELECT * FROM users WHERE name LIKE 'John%';"
      },
      {
        title: "IN / BETWEEN",
        syntax: "WHERE col IN (v1, v2) / BETWEEN v1 AND v2;",
        description: "เช็คค่าในกลุ่ม หรือในช่วงข้อมูล",
        example: "SELECT * FROM sales WHERE amount BETWEEN 100 AND 500;"
      },
      {
        title: "CASE WHEN (Logic)",
        syntax: "CASE WHEN cond THEN res ELSE res END;",
        description: "การเขียน If-Else ในคำสั่ง SQL",
        example: "SELECT name, CASE WHEN score >= 50 THEN 'Pass' ELSE 'Fail' END as status FROM results;"
      }
    ]
  },
  {
    category: "Data Modification (DML)",
    icon: Edit3,
    items: [
      {
        title: "INSERT INTO",
        syntax: "INSERT INTO table (col1, col2) VALUES (v1, v2);",
        description: "เพิ่มข้อมูลใหม่ลงในตาราง",
        example: "INSERT INTO users (name, email) VALUES ('Alice', 'alice@dev.com');"
      },
      {
        title: "UPDATE",
        syntax: "UPDATE table SET col = val WHERE condition;",
        description: "แก้ไขข้อมูลเดิม (ระวัง! ต้องมี WHERE เสมอ)",
        example: "UPDATE employees SET salary = salary * 1.1 WHERE id = 101;"
      },
      {
        title: "DELETE",
        syntax: "DELETE FROM table WHERE condition;",
        description: "ลบข้อมูลออกจากตาราง (ระวัง! ต้องมี WHERE เสมอ)",
        example: "DELETE FROM tasks WHERE status = 'completed';"
      },
      {
        title: "TRUNCATE",
        syntax: "TRUNCATE TABLE table_name;",
        description: "ลบข้อมูลทั้งหมดในตาราง (เร็วกว่า DELETE แต่กู้คืนไม่ได้)",
        example: "TRUNCATE TABLE logs;"
      }
    ]
  },
  {
    category: "Schema & Tables (DDL)",
    icon: Settings,
    items: [
      {
        title: "CREATE TABLE",
        syntax: "CREATE TABLE table (col type constraints);",
        description: "สร้างตารางใหม่พร้อมกำหนดประเภทข้อมูล",
        example: "CREATE TABLE posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL);"
      },
      {
        title: "ALTER TABLE",
        syntax: "ALTER TABLE table ADD/DROP/RENAME COLUMN col;",
        description: "แก้ไขโครงสร้างตารางเดิม",
        example: "ALTER TABLE users ADD COLUMN phone_number VARCHAR(15);"
      },
      {
        title: "DROP TABLE",
        syntax: "DROP TABLE IF EXISTS table_name;",
        description: "ลบตารางออกจากฐานข้อมูล",
        example: "DROP TABLE deprecated_data;"
      }
    ]
  },
  {
    category: "Constraints (กฎข้อมูล)",
    icon: ShieldCheck,
    items: [
      {
        title: "PRIMARY KEY",
        syntax: "ID INT PRIMARY KEY;",
        description: "ระบุคอลัมน์ที่เป็นค่าอ้างอิงหลัก (ไม่ซ้ำและไม่ว่าง)",
        example: "user_id UUID PRIMARY KEY DEFAULT gen_random_uuid();"
      },
      {
        title: "FOREIGN KEY",
        syntax: "FOREIGN KEY (col) REFERENCES other_table(id);",
        description: "สร้างความสัมพันธ์กับตารางอื่น",
        example: "dept_id INT REFERENCES departments(id) ON DELETE CASCADE;"
      },
      {
        title: "CHECK",
        syntax: "CHECK (condition);",
        description: "กำหนดเงื่อนไขความถูกต้องของข้อมูล",
        example: "price DECIMAL CHECK (price > 0);"
      }
    ]
  },
  {
    category: "Joins (Table Relations)",
    icon: LinkIcon,
    items: [
      {
        title: "INNER JOIN",
        syntax: "SELECT * FROM T1 JOIN T2 ON T1.id = T2.id;",
        description: "ดึงข้อมูลเฉพาะแถวที่มีค่าตรงกันทั้งสองตาราง",
        example: "SELECT e.name, d.name FROM employees e JOIN depts d ON e.dept_id = d.id;"
      },
      {
        title: "LEFT JOIN",
        syntax: "SELECT * FROM T1 LEFT JOIN T2 ON T1.id = T2.id;",
        description: "ดึงข้อมูลฝั่งซ้ายทั้งหมด แม้ฝั่งขวาจะไม่ตรงกัน",
        example: "SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id;"
      },
      {
        title: "FULL OUTER JOIN",
        syntax: "SELECT * FROM T1 FULL JOIN T2 ON T1.id = T2.id;",
        description: "รวมข้อมูลจากทั้งสองตาราง ไม่ว่าจะแมตช์กันหรือไม่",
        example: "SELECT * FROM t1 FULL JOIN t2 ON t1.id = t2.id;"
      }
    ]
  },
  {
    category: "Functions (String/Date)",
    icon: Type,
    items: [
      {
        title: "String Functions",
        syntax: "CONCAT(), UPPER(), LOWER(), TRIM(), LENGTH();",
        description: "การจัดการข้อความ",
        example: "SELECT CONCAT(first_name, ' ', last_name) as full_name FROM emp;"
      },
      {
        title: "Date Functions",
        syntax: "NOW(), CURRENT_DATE, DATE_TRUNC(), EXTRACT();",
        description: "การจัดการวันที่และเวลา",
        example: "SELECT EXTRACT(YEAR FROM created_at) FROM users;"
      },
      {
        title: "COALESCE",
        syntax: "COALESCE(val, fallback);",
        description: "ถ้าค่าแรกเป็น NULL ให้ใช้ค่าที่สองแทน",
        example: "SELECT COALESCE(avatar_url, 'default.png') FROM profiles;"
      }
    ]
  },
  {
    category: "Advanced: CTEs & Analytics",
    icon: Zap,
    items: [
      {
        title: "WITH (CTE)",
        syntax: "WITH name AS (SELECT ...) SELECT * FROM name;",
        description: "สร้างตารางชั่วคราวเพื่อให้ Query อ่านง่ายขึ้น",
        example: "WITH high_sal AS (SELECT * FROM emp WHERE sal > 5000) SELECT * FROM high_sal;"
      },
      {
        title: "Window Functions",
        syntax: "FUNC() OVER (PARTITION BY col ORDER BY col);",
        description: "คำนวณค่าโดยไม่ยุบแถว (RANK, ROW_NUMBER, LAG, LEAD)",
        example: "SELECT name, RANK() OVER (ORDER BY salary DESC) FROM emp;"
      }
    ]
  }
];

export default function SqlCheatSheetPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filteredData = cheatSheetData.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase()) ||
      item.syntax.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("คัดลอกคำสั่งไปยัง Clipboard แล้ว");
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => router.push("/sql-practice/learn")} className="-ml-2 h-8">
              <ArrowLeft className="mr-1 size-4" /> SQL Academy
            </Button>
          </div>
          <h2 className="text-3xl font-bold tracking-tight">SQL Cheat Sheet</h2>
          <p className="text-muted-foreground">สรุปคำสั่ง SQL พื้นฐานจนถึงระดับสูง ครบถ้วนทุกหมวดหมู่</p>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="ค้นหาคำสั่ง (เช่น JOIN, CREATE, CASE)..." 
            className="pl-9 h-11"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {filteredData.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <cat.icon className="size-4" />
              </div>
              <h3 className="text-xl font-bold">{cat.category}</h3>
              <Badge variant="secondary" className="ml-auto">{cat.items.length} รายการ</Badge>
            </div>
            <div className="grid gap-4">
              {cat.items.map((item) => (
                <Card key={item.title} className="overflow-hidden group hover:border-primary/50 transition-all">
                  <CardHeader className="p-4 pb-2 bg-muted/30">
                    <CardTitle className="text-sm font-bold flex items-center justify-between">
                      <span className="group-hover:text-primary transition-colors">{item.title}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-7 hover:bg-background"
                        onClick={() => copyToClipboard(item.syntax)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-3 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.description}
                    </p>
                    <div className="relative group/code">
                      <div className="rounded-lg bg-zinc-950 p-3 font-mono text-[11px] text-zinc-300 break-all border border-zinc-800">
                        <span className="text-blue-400">{item.syntax.split(' ')[0]}</span>
                        {item.syntax.substring(item.syntax.indexOf(' '))}
                      </div>
                    </div>
                    <div className="flex items-start gap-2 rounded-md bg-primary/5 p-2 text-[10px]">
                      <span className="font-bold text-primary shrink-0">EX:</span>
                      <code className="text-muted-foreground italic leading-normal">{item.example}</code>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="size-12 text-muted-foreground/20 mb-4" />
          <h3 className="text-lg font-medium">ไม่พบข้อมูลที่ค้นหา</h3>
          <p className="text-sm text-muted-foreground">ลองใช้คำค้นหาอื่น</p>
        </div>
      )}
    </div>
  );
}
