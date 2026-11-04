"use client";

import { useState } from "react";

import { IssueCard, type IssueStatus, type ScanIssue } from "./issue-card";

const initial: ScanIssue = {
  id: "sql",
  severity: "critical",
  category: "security",
  title: "SQL query built from user input",
  message: "The search term is concatenated into a raw SQL string, which allows SQL injection.",
  filePath: "src/modules/products/products.repository.ts",
  lineStart: 42,
  lineEnd: 43,
  aiGenerated: true,
  status: "open",
  autoFixable: true,
  codeSnippet: [
    "export async function searchProducts(db: Db, term: string) {",
    "  // TODO: paginate",
    "  const sql = `SELECT * FROM products WHERE name LIKE '%${term}%'`;",
    "  return db.query(sql);",
    "}",
  ].join("\n"),
  fixSuggestion: {
    description: "Use a parameterised query so the database driver escapes the search term.",
    before: "const sql = `SELECT * FROM products WHERE name LIKE '%${term}%'`;\nreturn db.query(sql);",
    after: "const sql = 'SELECT * FROM products WHERE name LIKE $1';\nreturn db.query(sql, [`%${term}%`]);",
    canAutoFix: true,
    difficulty: "easy",
    estimatedTime: 5,
    reasoning: "Parameters keep the query plan cached and close the injection hole.",
    steps: [
      { step: 1, description: "Replace the template literal with a $1 placeholder." },
      { step: 2, description: "Pass the wrapped term as the second argument.", code: "db.query(sql, [`%${term}%`])" },
    ],
  },
};

export default function IssueCardDemo() {
  const [issue, setIssue] = useState(initial);

  const updateStatus = async (_id: string, status: IssueStatus) => {
    await new Promise((r) => setTimeout(r, 400));
    setIssue((i) => ({ ...i, status }));
  };

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <IssueCard issue={issue} onStatusChange={updateStatus} onAutoFix={(id) => updateStatus(id, "resolved")} confirmIgnore={() => true} fixed={false} />
    </div>
  );
}
