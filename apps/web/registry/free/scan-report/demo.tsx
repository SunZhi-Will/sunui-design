"use client";

import { useState } from "react";

import { ScanReport, type IssueStatus, type ScanIssue } from "./scan-report";

const initial: ScanIssue[] = [
  {
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
      reasoning: "AI-generated data access code often inlines template strings. Parameters keep the query plan cached and close the injection hole.",
      steps: [
        { step: 1, description: "Replace the template literal with a $1 placeholder." },
        { step: 2, description: "Pass the wrapped term as the second argument.", code: "db.query(sql, [`%${term}%`])" },
      ],
    },
  },
  {
    id: "n1",
    severity: "high",
    category: "performance",
    title: "N+1 queries when loading order items",
    message: "Each order triggers a separate query for its items inside a loop.",
    filePath: "src/modules/orders/orders.service.ts",
    lineStart: 88,
    lineEnd: 90,
    aiGenerated: true,
    status: "open",
    fixSuggestion: {
      description: "Load all items for the page of orders in one query, then group them in memory.",
      before: "for (const order of orders) {\n  order.items = await this.items.findBy({ orderId: order.id });\n}",
      after: "const items = await this.items.findBy({ orderId: In(orders.map((o) => o.id)) });\nconst byOrder = groupBy(items, 'orderId');\norders.forEach((o) => (o.items = byOrder[o.id] ?? []));",
      canAutoFix: false,
      difficulty: "medium",
      estimatedTime: 20,
    },
  },
  {
    id: "any",
    severity: "medium",
    category: "quality",
    title: "Response typed as any",
    message: "The API response is cast to any, so type errors in the checkout flow are not caught.",
    filePath: "src/app/checkout/useCheckout.ts",
    lineStart: 17,
    lineEnd: 17,
    aiGenerated: false,
    status: "open",
    codeSnippet: "const data: any = await res.json();",
  },
  {
    id: "dup",
    severity: "low",
    category: "maintainability",
    title: "Duplicated price formatting helper",
    message: "formatPrice is implemented three times with slightly different rounding.",
    filePath: "src/lib/format.ts",
    lineStart: 5,
    lineEnd: 9,
    aiGenerated: true,
    status: "resolved",
  },
];

export default function ScanReportDemo() {
  const [issues, setIssues] = useState(initial);

  const updateStatus = async (id: string, status: IssueStatus) => {
    await new Promise((r) => setTimeout(r, 400));
    setIssues((list) => list.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  return (
    <div className="w-full min-w-0">
      <ScanReport
        issues={issues}
        stats={{ filesScanned: 214, linesOfCode: 18342, scanType: "full", healthScore: 72, healthScoreReason: "One critical security issue and repeated N+1 query patterns lower the score." }}
        onStatusChange={updateStatus}
        onAutoFix={(id) => updateStatus(id, "resolved")}
        confirmIgnore={() => true}
      />
    </div>
  );
}
