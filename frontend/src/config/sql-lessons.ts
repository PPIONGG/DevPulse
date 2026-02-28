export interface SqlLesson {
  id: string;
  title: string;
  description: string;
  content: string;
  practiceQuery: string;
  expectedOutput?: string;
  tableName?: string;
}

export interface SqlModule {
  id: string;
  title: string;
  lessons: SqlLesson[];
}

export const sqlModules: SqlModule[] = [
  {
    id: "basics",
    title: "1. The Basics of Data",
    lessons: [
      {
        id: "intro-to-sql",
        title: "What is SQL?",
        description: "Learn what SQL is and why it's the language of data.",
        content: `SQL stands for **Structured Query Language**. It is used to communicate with databases. Think of a database like a giant Excel file with many sheets (we call these **Tables**).

In this lesson, you'll learn your first command: \`SELECT\`.

\`SELECT\` is used to pick which columns you want to see.
\`FROM\` tells the database which table to look into.

**Try it:** Select everything from the \`users\` table.`,
        practiceQuery: "SELECT * FROM users;",
        tableName: "users"
      },
      {
        id: "selecting-columns",
        title: "Selecting Specific Columns",
        description: "How to pick only the data you need.",
        content: `Using \`*\` gets every column, but usually, we only need a few. To do this, you list the column names separated by commas.

Example: \`SELECT name, email FROM users;\`

**Try it:** Select only the \`username\` and \`display_name\` from the \`users\` table.`,
        practiceQuery: "SELECT username, display_name FROM users;",
        tableName: "users"
      }
    ]
  },
  {
    id: "filtering",
    title: "2. Filtering Data",
    lessons: [
      {
        id: "where-clause",
        title: "The WHERE Clause",
        description: "Filter rows based on specific conditions.",
        content: `The \`WHERE\` clause allows you to filter rows. Only rows that meet the condition will be shown.

Example: \`SELECT * FROM products WHERE price > 100;\`

Common operators:
- \`=\` (Equals)
- \`!=\` (Not equals)
- \`>\` (Greater than)
- \`<\` (Less than)
- \`LIKE\` (Pattern matching)

**Try it:** Find all users where the \`id\` is '1'.`,
        practiceQuery: "SELECT * FROM users WHERE id = '1';",
        tableName: "users"
      }
    ]
  },
  {
    id: "joins",
    title: "3. Combining Tables",
    lessons: [
      {
        id: "inner-join",
        title: "The Power of JOIN",
        description: "How to combine data from two different tables.",
        content: `In relational databases, data is split into multiple tables. We use \`JOIN\` to bring them back together.

An \`INNER JOIN\` only returns rows where there is a match in both tables.

**Try it:** Join \`users\` with their \`profiles\`.`,
        practiceQuery: "SELECT users.username, profiles.bio FROM users INNER JOIN profiles ON users.id = profiles.id;",
        tableName: "users"
      }
    ]
  }
];
