"use client";

import { useState } from "react";

import { IssueCard, type IssueStatus, type ScanIssue } from "./issue-card";

const initial: ScanIssue = {
  id: "sql",
  severity: "critical",
  category: "security",
  title: "SQL query built from user input",
  message: "The search term is concatenated into raw SQL.",
  filePath: "src/products.repository.ts",
  lineStart: 42,
  lineEnd: 43,
  status: "open",
  codeSnippet: [
    "export async function searchProducts(db: Db, term: string) {",
    "  const sql = `SELECT * FROM products WHERE name LIKE '%${term}%'`;",
    "  return db.query(sql);",
    "}",
  ].join("\n"),
};

/** 型錄卡片：一張掃描問題卡，可展開程式碼、標記已解決或忽略（卡內可捲動）。 */
export default function IssueCardCard() {
  const [issue, setIssue] = useState(initial);

  const updateStatus = async (_id: string, status: IssueStatus) => {
    await new Promise((r) => setTimeout(r, 400));
    setIssue((i) => ({ ...i, status }));
  };

  return (
    <div className="mx-auto h-56 w-72 overflow-y-auto rounded-lg bg-card text-card-foreground">
      <IssueCard issue={issue} onStatusChange={updateStatus} confirmIgnore={() => true} fixed={false} />
    </div>
  );
}
