// 中日文標題的斷行：瀏覽器不懂中文詞界，text-balance 會把「聖誕」斷成兩行。
// 在全形標點後切段，每段 inline-block，換行就只會落在標點之後；
// 段落比一行還長時，inline-block 內部照常換行，不會溢出。
// 日文另外靠 h1 上的 word-break: auto-phrase（Chromium 依 lang="ja" 切詞），
// 並搭配 overflow-wrap: anywhere，單一詞組比手機寬度還長時才允許硬斷。
const PHRASE_END = /(?<=[、，。！？：；])/u;

export function PhraseText({ text }: { text: string }) {
  const parts = text.split(PHRASE_END).filter(Boolean);
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((part, i) => (
        <span key={i} className="inline-block">
          {part}
        </span>
      ))}
    </>
  );
}
