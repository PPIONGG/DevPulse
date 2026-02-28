"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface CheatItem {
  title: string;
  syntax: string;
  description: string;
  example: string;
}

interface CheatCategory {
  category: string;
  items: CheatItem[];
}

const cheatSheetData: CheatCategory[] = [
  {
    category: "Basics",
    items: [
      {
        title: "SELECT",
        syntax: "SELECT column1, column2 FROM table_name;",
        description: "Extracts data from a database.",
        example: "SELECT first_name, last_name FROM employees;"
      },
      {
        title: "SELECT DISTINCT",
        syntax: "SELECT DISTINCT column1 FROM table_name;",
        description: "Returns only unique values.",
        example: "SELECT DISTINCT department_id FROM employees;"
      }
    ]
  },
  {
    category: "Filtering",
    items: [
      {
        title: "WHERE",
        syntax: "SELECT * FROM table WHERE condition;",
        description: "Filters records based on a condition.",
        example: "SELECT * FROM employees WHERE salary > 50000;"
      },
      {
        title: "AND, OR, NOT",
        syntax: "SELECT * FROM table WHERE cond1 AND cond2;",
        description: "Combine multiple conditions.",
        example: "SELECT * FROM users WHERE age > 18 AND city = 'Bangkok';"
      },
      {
        title: "IN",
        syntax: "WHERE column IN (val1, val2, ...);",
        description: "Specify multiple possible values for a column.",
        example: "SELECT * FROM employees WHERE id IN (1, 3, 5);"
      },
      {
        title: "LIKE",
        syntax: "WHERE column LIKE pattern;",
        description: "Search for a specified pattern in a column.",
        example: "SELECT * FROM employees WHERE name LIKE 'A%';"
      }
    ]
  },
  {
    category: "Aggregation",
    items: [
      {
        title: "COUNT",
        syntax: "SELECT COUNT(column) FROM table;",
        description: "Returns the number of rows.",
        example: "SELECT COUNT(*) FROM orders;"
      },
      {
        title: "SUM / AVG",
        syntax: "SELECT SUM(column) FROM table;",
        description: "Returns the total sum or average of a numeric column.",
        example: "SELECT AVG(salary) FROM employees;"
      },
      {
        title: "GROUP BY",
        syntax: "SELECT col, COUNT(*) FROM table GROUP BY col;",
        description: "Groups rows that have the same values.",
        example: "SELECT dept_id, COUNT(*) FROM employees GROUP BY dept_id;"
      }
    ]
  },
  {
    category: "Joins",
    items: [
      {
        title: "INNER JOIN",
        syntax: "SELECT * FROM T1 INNER JOIN T2 ON T1.id = T2.id;",
        description: "Returns records that have matching values in both tables.",
        example: "SELECT e.name, d.name FROM employees e JOIN departments d ON e.dept_id = d.id;"
      },
      {
        title: "LEFT JOIN",
        syntax: "SELECT * FROM T1 LEFT JOIN T2 ON T1.id = T2.id;",
        description: "Returns all records from the left table, and matched records from the right.",
        example: "SELECT * FROM users LEFT JOIN profiles ON users.id = profiles.user_id;"
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
      item.description.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/sql-practice/learn")}>
            <ArrowLeft className="mr-1 size-4" /> Academy
          </Button>
          <h2 className="text-2xl font-bold">SQL Cheat Sheet</h2>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Search syntax..." 
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {filteredData.map((cat) => (
          <div key={cat.category} className="space-y-4">
            <h3 className="text-lg font-bold text-primary border-b pb-1">
              {cat.category}
            </h3>
            {cat.items.map((item) => (
              <Card key={item.title}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold flex items-center justify-between">
                    {item.title}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-6"
                      onClick={() => copyToClipboard(item.syntax)}
                    >
                      <Copy className="size-3" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                  <div className="rounded bg-muted p-2 font-mono text-[10px] break-all">
                    {item.syntax}
                  </div>
                  <div className="text-[10px]">
                    <span className="font-semibold text-primary">Example:</span>
                    <code className="ml-1 text-muted-foreground">{item.example}</code>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
