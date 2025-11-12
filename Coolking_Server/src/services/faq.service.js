// services/faq.service.js
const { FaqSection } = require("../databases/mongodb/schemas/FaqSection");
const { openai } = require("../config/openIA.conf");

// Verify connection before querying
async function ensureConnection() {
  if (!FaqSection) {
    throw new Error("FaqSection schema is not initialized.");
  }
  // Test the connection
  try {
    await FaqSection.collection.estimatedDocumentCount();
  } catch (err) {
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

// Lấy danh sách mục (5 mục của bạn)
async function listSections() {
  await ensureConnection();
  const docs = await FaqSection.find({}, { section: 1 }).sort({ section: 1 }).lean();
  return docs.map(d => d.section);
}

const norm = s => (s || "")
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/\s+/g, " ").trim();

// helpers: tokenize & jaccard cho khớp gần đúng
const toTokens = s => norm(s).split(/\s+/).filter(Boolean);
const jaccard = (A, B) => {
  const a = new Set(A), b = new Set(B);
  const inter = [...a].filter(x => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
};

// Tìm top-k Q&A tốt nhất trên 1 mảng doc đã load (mọi section)
function findBestMatchesAcrossDocs(question, docs, k = 6) {
  const qTok = toTokens(question);
  const exact = [];
  const scored = [];

  for (const d of docs) {
    for (const qa of d.QuestionsAndAnswers || []) {
      // Ưu tiên khớp chính xác theo câu hỏi (so sánh đã bỏ dấu)
      if (norm(qa.q) === norm(question)) {
        exact.push({ section: d.section, ...qa, score: 1 });
      } else {
        const sQ = jaccard(qTok, toTokens(qa.q));
        const sA = jaccard(qTok, toTokens(qa.a));
        const score = Math.max(sQ, sA);
        scored.push({ section: d.section, ...qa, score });
      }
    }
  }

  if (exact.length) {
    // Nếu có khớp exact, chỉ trả exact (tránh nhiễu)
    return exact.slice(0, k);
  }
  return scored.sort((a,b)=>b.score-a.score).slice(0, k);
}

async function createChatMessageAI(
  section,
  question,
  { model = "gpt-4.1-mini", maxContextChars = 12000, maxTokens = 300 } = {}
) {
  if (!question) throw new Error("question is required");
  await ensureConnection();

  // Trường hợp 1: có section → y như trước (chỉ dùng 1 mục)
  if (section) {
    // exact trước, rồi normalized
    let doc = await FaqSection.findOne({ section }).lean();
    if (!doc) {
      const all = await FaqSection.find({}, { section:1, QuestionsAndAnswers:1 }).lean();
      doc = all.find(d => norm(d.section) === norm(section));
    }
    if (!doc) throw new Error(`Section not found: "${section}"`);
    if (!doc.QuestionsAndAnswers?.length) throw new Error("Empty section");

    let context = `MỤC: ${doc.section}\n\n`;
    for (let i = 0; i < doc.QuestionsAndAnswers.length; i++) {
      const qa = doc.QuestionsAndAnswers[i];
      context += `#${i+1}\nHỎI: ${qa.q}\nĐÁP: ${qa.a}\n\n`;
      if (context.length > maxContextChars) { context += `... (đã rút gọn)\n`; break; }
    }

    const r = await openai.chat.completions.create({
      model, temperature: 0,
      // max_tokens: maxTokens,
      messages: [
        { role: "system",
          content: 'Bạn là trợ lý học vụ. CHỈ trả lời dựa trên CONTEXT bên dưới. Nếu không có, nói: "Không có trong dữ liệu."' },
        { role: "user",
          content: `CONTEXT (theo mục đã chọn):\n${context}\n\nCÂU HỎI: ${question}\nYÊU CẦU: trả lời ngắn gọn, dẫn #n nếu có.` }
      ]
    });

    return { answer: r.choices?.[0]?.message?.content?.trim() || "", section: doc.section };
  }

  // Trường hợp 2: section == null → duyệt toàn bộ, lấy top-k gần đúng/đúng
  const allDocs = await FaqSection.find({}, { section:1, QuestionsAndAnswers:1 }).lean();
  if (!allDocs.length) throw new Error("No data");

  const top = findBestMatchesAcrossDocs(question, allDocs, 6);
  if (!top.length || (top[0].score ?? 0) < 0.12) {
    // Không có gì đủ gần -> trả mặc định
    return { answer: "Không có trong dữ liệu.", section: null, matches: [] };
  }

  // Dựng context từ top-k (ghi rõ section từng dòng)
  let context = "";
  top.forEach((t, i) => {
    context += `#${i+1} [${t.section}] HỎI: ${t.q}\nĐÁP: ${t.a}\n\n`;
  });
  if (context.length > maxContextChars) {
    context = context.slice(0, maxContextChars) + "\n... (đã rút gọn)\n";
  }

  const r = await openai.chat.completions.create({
    model, temperature: 0,
    // max_tokens: maxTokens,
    messages: [
      { role: "system",
        content: 'Bạn là trợ lý học vụ. CHỈ trả lời dựa trên CONTEXT sau (bao gồm nhiều mục). Nếu không có, trả: "Không có trong dữ liệu."' },
      { role: "user",
        content: `CONTEXT (top kết quả từ nhiều mục):\n${context}\n\nCÂU HỎI: ${question}\nYÊU CẦU: trả lời ngắn gọn, nếu có nêu #n và tên mục [section].` }
    ]
  });

  const answer = r.choices?.[0]?.message?.content?.trim() || top[0].a;
  return {
    answer,
    section: null,
    matches: top.map((m,i)=>({ rank: i+1, section: m.section, q: m.q, score: Number(m.score?.toFixed(3) || 1) }))
  };
}


module.exports = { listSections, createChatMessageAI };