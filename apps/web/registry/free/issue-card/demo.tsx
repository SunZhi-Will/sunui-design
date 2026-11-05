"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

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

type IssueText = Pick<ScanIssue, "title" | "message"> & { fix: Pick<NonNullable<ScanIssue["fixSuggestion"]>, "description" | "reasoning"> & { steps: string[] } };

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", IssueText> = {
  en: {
    title: "SQL query built from user input",
    message: "The search term is concatenated into a raw SQL string, which allows SQL injection.",
    fix: {
      description: "Use a parameterised query so the database driver escapes the search term.",
      reasoning: "Parameters keep the query plan cached and close the injection hole.",
      steps: ["Replace the template literal with a $1 placeholder.", "Pass the wrapped term as the second argument."],
    },
  },
  "zh-TW": {
    title: "以使用者輸入組成的 SQL 查詢",
    message: "搜尋字詞被直接串接進原始 SQL 字串，可能遭到 SQL 注入攻擊。",
    fix: {
      description: "改用參數化查詢，讓資料庫驅動程式替搜尋字詞做跳脫。",
      reasoning: "參數化能讓查詢計畫保持快取，同時堵住注入漏洞。",
      steps: ["把樣板字串換成 $1 佔位符。", "把包好的字詞當作第二個參數傳入。"],
    },
  },
  "zh-CN": {
    title: "用用户输入拼接的 SQL 查询",
    message: "搜索词被直接拼接进原始 SQL 字符串，存在 SQL 注入风险。",
    fix: {
      description: "改用参数化查询，让数据库驱动负责转义搜索词。",
      reasoning: "参数化能让查询计划保持缓存，同时堵住注入漏洞。",
      steps: ["把模板字符串替换为 $1 占位符。", "把包装好的搜索词作为第二个参数传入。"],
    },
  },
  ja: {
    title: "ユーザー入力から組み立てた SQL クエリ",
    message: "検索語が生の SQL 文字列に直接連結されており、SQL インジェクションの恐れがあります。",
    fix: {
      description: "パラメータ化クエリを使い、検索語のエスケープをデータベースドライバに任せます。",
      reasoning: "パラメータを使うとクエリプランがキャッシュされ、インジェクションの穴も塞げます。",
      steps: ["テンプレートリテラルを $1 プレースホルダーに置き換えます。", "囲んだ検索語を第 2 引数として渡します。"],
    },
  },
};

export default function IssueCardDemo() {
  const locale = useDemoLocale();
  const text = useDemoText(copy);
  const [issue, setIssue] = useState(initial);
  const fix = issue.fixSuggestion!;
  const localized: ScanIssue = {
    ...issue,
    title: text.title,
    message: text.message,
    fixSuggestion: {
      ...fix,
      description: text.fix.description,
      reasoning: text.fix.reasoning,
      steps: fix.steps?.map((s, i) => ({ ...s, description: text.fix.steps[i] ?? s.description })),
    },
  };

  const updateStatus = async (_id: string, status: IssueStatus) => {
    await new Promise((r) => setTimeout(r, 400));
    setIssue((i) => ({ ...i, status }));
  };

  return (
    <div className="w-full min-w-0 rounded-lg border border-border bg-card p-4 text-card-foreground shadow-sm">
      <IssueCard locale={locale} issue={localized} onStatusChange={updateStatus} onAutoFix={(id) => updateStatus(id, "resolved")} confirmIgnore={() => true} fixed={false} />
    </div>
  );
}
