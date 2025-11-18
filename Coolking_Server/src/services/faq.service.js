// services/faq.service.js
const { FaqSection } = require("../databases/mongodb/schemas/FaqSection");
const { openai } = require("../config/openIA.conf");

// ================== CONFIG ==================
const OUT_OF_SCOPE_MESSAGE =
  "Câu hỏi này nằm ngoài phạm vi trả lời của tôi, hãy liên hệ Quản trị viên hệ thống - SĐT 0834258511 để có được câu trả lời chính xác nhất.";

const MIN_SCORE = 0.25;          // ngưỡng tương đồng tối thiểu (0.2–0.3 là hợp lý)
const DEFAULT_MODEL = "gpt-4.1-mini";

// ================== COMMON UTILS ==================
async function ensureConnection() {
  if (!FaqSection) {
    throw new Error("FaqSection schema is not initialized.");
  }
  try {
    await FaqSection.collection.estimatedDocumentCount();
  } catch (err) {
    throw new Error(`Database connection failed: ${err.message}`);
  }
}

// Lấy danh sách section cho UI dropdown
async function listSections() {
  await ensureConnection();
  const docs = await FaqSection.find({}, { section: 1 }).sort({ section: 1 }).lean();
  return docs.map(d => d.section);
}

const norm = s => (s || "")
  .toLowerCase()
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // bỏ dấu tiếng Việt
  .replace(/\s+/g, " ").trim();

const toTokens = s => norm(s).split(/\s+/).filter(Boolean);

const jaccard = (A, B) => {
  const a = new Set(A), b = new Set(B);
  const inter = [...a].filter(x => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return uni ? inter / uni : 0;
};

// ================== MATCH HELPERS ==================
// 🔎 Tìm top-k trong 1 document, chỉ dựa trên CÂU HỎI (qa.q)
function findBestMatchesInDoc(question, doc, k = 6) {
  const qTok = toTokens(question);
  const exact = [];
  const scored = [];

  for (const qa of doc.QuestionsAndAnswers || []) {
    const qTokens = toTokens(qa.q);

    // Nếu giống 100% sau khi bỏ dấu → coi là exact
    if (norm(qa.q) === norm(question)) {
      exact.push({ section: doc.section, ...qa, score: 1 });
    } else {
      const score = jaccard(qTok, qTokens);
      scored.push({ section: doc.section, ...qa, score });
    }
  }

  if (exact.length) return exact.slice(0, k);
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

// 🔎 Tìm top-k trên nhiều document
function findBestMatchesAcrossDocs(question, docs, k = 6) {
  const qTok = toTokens(question);
  const exact = [];
  const scored = [];

  for (const d of docs) {
    for (const qa of d.QuestionsAndAnswers || []) {
      const qTokens = toTokens(qa.q);

      if (norm(qa.q) === norm(question)) {
        exact.push({ section: d.section, ...qa, score: 1 });
      } else {
        const score = jaccard(qTok, qTokens);
        scored.push({ section: d.section, ...qa, score });
      }
    }
  }

  if (exact.length) return exact.slice(0, k);
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

// ================== AI MAIN FUNCTION ==================
async function createChatMessageAI(
  section,
  question,
  { model = DEFAULT_MODEL, maxContextChars = 12000, maxTokens = 300 } = {}
) {
  if (!question) throw new Error("question is required");
  await ensureConnection();

  // ===== TRƯỜNG HỢP 1: CÓ SECTION (chỉ trong 1 mục) =====
  if (section) {
    let doc = await FaqSection.findOne({ section }).lean();
    if (!doc) {
      const all = await FaqSection.find({}, { section: 1, QuestionsAndAnswers: 1 }).lean();
      doc = all.find(d => norm(d.section) === norm(section));
    }
    if (!doc) {
      // Không có mục này trong DB -> out of scope luôn
      return { answer: OUT_OF_SCOPE_MESSAGE, section: null, matches: [] };
    }
    if (!doc.QuestionsAndAnswers?.length) {
      return { answer: OUT_OF_SCOPE_MESSAGE, section: doc.section, matches: [] };
    }

    // Lọc Q&A gần nhất trong chính section đó
    const top = findBestMatchesInDoc(question, doc, 6);
    if (!top.length || (top[0].score ?? 0) < MIN_SCORE) {
      // Câu hỏi không giống Q&A nào đủ mức tin cậy → KHÔNG GỌI AI, trả luôn message custom
      return { answer: OUT_OF_SCOPE_MESSAGE, section: doc.section, matches: [] };
    }

    // Build context từ top-k thay vì cả section
    let context = `MỤC: ${doc.section}\n\n`;
    top.forEach((t, i) => {
      context += `#${i + 1} HỎI: ${t.q}\nĐÁP: ${t.a}\n\n`;
    });
    if (context.length > maxContextChars) {
      context = context.slice(0, maxContextChars) + "\n... (đã rút gọn)\n";
    }

    const r = await openai.chat.completions.create({
      model,
      temperature: 0,
      // max_tokens: maxTokens,
      messages: [
        {
          role: "system",
          content:
            `Bạn là trợ lý học vụ. CHỈ trả lời dựa trên CONTEXT bên dưới (các quy định chính thức).\n` +
            `Nếu câu hỏi không nằm trong CONTEXT, hãy trả lời CHÍNH XÁC như sau (không thêm bớt):\n` +
            `"${OUT_OF_SCOPE_MESSAGE}"`
        },
        {
          role: "user",
          content:
            `CONTEXT (theo mục đã chọn):\n${context}\n\n` +
            `CÂU HỎI: ${question}\n\n` +
            "YÊU CẦU: trả lời ngắn gọn, chính xác; nếu được, nêu #n tương ứng."
        }
      ]
    });

    return {
      answer: r.choices?.[0]?.message?.content?.trim() || OUT_OF_SCOPE_MESSAGE,
      section: doc.section,
      matches: top.map((m, i) => ({
        rank: i + 1,
        q: m.q,
        score: Number(m.score.toFixed(3))
      }))
    };
  }

  // ===== TRƯỜNG HỢP 2: KHÔNG CÓ SECTION (tìm trên toàn bộ) =====
  const allDocs = await FaqSection.find({}, { section: 1, QuestionsAndAnswers: 1 }).lean();
  if (!allDocs.length) {
    return { answer: OUT_OF_SCOPE_MESSAGE, section: null, matches: [] };
  }

  const top = findBestMatchesAcrossDocs(question, allDocs, 6);
  if (!top.length || (top[0].score ?? 0) < MIN_SCORE) {
    return { answer: OUT_OF_SCOPE_MESSAGE, section: null, matches: [] };
  }

  let context = "";
  top.forEach((t, i) => {
    context += `#${i + 1} [${t.section}] HỎI: ${t.q}\nĐÁP: ${t.a}\n\n`;
  });
  if (context.length > maxContextChars) {
    context = context.slice(0, maxContextChars) + "\n... (đã rút gọn)\n";
  }

  const r = await openai.chat.completions.create({
    model,
    temperature: 0,
    // max_tokens: maxTokens,
    messages: [
      {
        role: "system",
        content:
          `Bạn là trợ lý học vụ. CHỈ trả lời dựa trên CONTEXT sau (bao gồm nhiều mục).\n` +
          `Nếu câu hỏi không nằm trong CONTEXT, hãy trả lời CHÍNH XÁC như sau (không thêm bớt):\n` +
          `"${OUT_OF_SCOPE_MESSAGE}"`
      },
      {
        role: "user",
        content:
          `CONTEXT (top kết quả từ nhiều mục):\n${context}\n\n` +
          `CÂU HỎI: ${question}\n` +
          "YÊU CẦU: trả lời ngắn gọn, nếu có nêu #n và [section]."
      }
    ]
  });

  const answer = r.choices?.[0]?.message?.content?.trim() || OUT_OF_SCOPE_MESSAGE;
  return {
    answer,
    section: null,
    matches: top.map((m, i) => ({
      rank: i + 1,
      section: m.section,
      q: m.q,
      score: Number(m.score.toFixed(3))
    }))
  };
}

module.exports = {
  listSections,
  createChatMessageAI
};
