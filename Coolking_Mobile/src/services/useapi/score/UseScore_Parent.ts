import { useCallback, useEffect, useMemo, useState } from "react";
import { getScoresByStudentID } from "@/src/services/api/score/ScoreApi";

/** ====== Types từ payload ====== */
export type Subject = {
  subject_name: string;
  credits: number;
  theo_credit: number;
  pra_credit: number;
  average?: string;
  grade_point?: string;
  midterm?: string;
  final?: string;
  theo_regular1?: string;
  theo_regular2?: string;
  theo_regular3?: string;
  pra_regular1?: string;
  pra_regular2?: string;
  pra_regular3?: string;
};

export type SemesterBlock = {
  academic_year: string;          // "2025-2026"
  semester: "HK1" | "HK2" | "HK3";
  subjects: Subject[];
  total_subjects: number;
  total_credits: number;
  gpa?: string;                   // GPA kỳ theo thang 4 (string) — có thể vắng
};

/** ====== Types cho UI ====== */
export type UiSemester = {
  id: string;   // "2025-2026-HK1"
  name: string; // "Học kỳ 1 - Năm học 2025-2026"
  gpa: number;  // 0..4
  credits: number;
};

export type UiSubject = {
  subject_name: string;
  credits: number;
  theo_credit: number;
  pra_credit: number;
  average?: number;
  grade_point?: number;
  midterm?: number;
  final?: number;
  theo_regulars: number[];
  pra_regulars: number[];
};

type StudentInfo = {
   student_id: string;
   name: string;
   class_name: string;
};


export type Overview = { cumulativeGpa: number; totalCredits: number };

/** ====== Helpers ====== */
type AnyPayload =
  | SemesterBlock[]
  | { data?: any }
  | { result?: any }
  | null
  | undefined;

const toNum = (v?: string | number | null): number | undefined => {
  if (v === undefined || v === null) return undefined;
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : undefined;
};
const nOr0 = (v?: string | number | null) => toNum(v) ?? 0;

const HK_LABEL: Record<"HK1" | "HK2" | "HK3", string> = {
  HK1: "Học kỳ 1",
  HK2: "Học kỳ 2",
  HK3: "Học kỳ 3",
};

const normalizeBlocks = (payload: AnyPayload): SemesterBlock[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload as SemesterBlock[];

  const maybeData = (payload as any).data ?? (payload as any).result ?? [];
  if (Array.isArray(maybeData)) return maybeData as SemesterBlock[];
  if (maybeData && Array.isArray(maybeData.data)) return maybeData.data as SemesterBlock[];

  return [];
};

/** Tính GPA kỳ nếu API không trả, theo điểm grade_point (thang 4) weighted theo credits.
 *  Nếu cả grade_point cũng không có → trả 0 (hoặc bạn có thể đổi sang quy tắc từ average).
 */
const computeSemesterGpa = (blk: SemesterBlock): number => {
  if (blk.gpa !== undefined) return nOr0(blk.gpa);
  const subjects = blk.subjects ?? [];
  let sum = 0;
  let credits = 0;
  for (const s of subjects) {
    const gp = toNum(s.grade_point);
    if (gp !== undefined) {
      sum += gp * (s.credits || 0);
      credits += s.credits || 0;
    }
  }
  return credits > 0 ? sum / credits : 0;
};

const mapUiSubject = (s: Subject): UiSubject => {
  const theo_regulars = [s.theo_regular1, s.theo_regular2, s.theo_regular3]
    .map(toNum)
    .filter((x): x is number => x !== undefined);
  const pra_regulars = [s.pra_regular1, s.pra_regular2, s.pra_regular3]
    .map(toNum)
    .filter((x): x is number => x !== undefined);

  return {
    subject_name: s.subject_name,
    credits: s.credits,
    theo_credit: s.theo_credit,
    pra_credit: s.pra_credit,
    average: toNum(s.average),
    grade_point: toNum(s.grade_point),
    midterm: toNum(s.midterm),
    final: toNum(s.final),
    theo_regulars,
    pra_regulars,
  };
};

/** ====== HOOK CHÍNH ====== */
export const useScore_Parent = (stID: string) => {
  // 🧱 Hook cố định (không điều kiện)
  const [blocks, setBlocks] = useState<SemesterBlock[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);

  /** Parse dữ liệu cho UI */
  const summary: UiSemester[] = useMemo(() => {
    if (!blocks.length) return [];
    const list = blocks.map((blk) => {
      const id = `${blk.academic_year}-${blk.semester}`;
      return {
        id,
        name: `${HK_LABEL[blk.semester]} - Năm học ${blk.academic_year}`,
        gpa: computeSemesterGpa(blk),
        credits: blk.total_credits || 0,
      } as UiSemester;
    });
    // sort theo năm học + HK1<HK2<HK3>
    const order: Record<"HK1" | "HK2" | "HK3", number> = { HK1: 1, HK2: 2, HK3: 3 };
    return list.sort((a, b) => {
      const yearA = a.id.slice(0, 9); // "2025-2026"
      const yearB = b.id.slice(0, 9);
      if (yearA !== yearB) return yearA.localeCompare(yearB);
      const hkA = a.id.slice(-3) as "HK1" | "HK2" | "HK3";
      const hkB = b.id.slice(-3) as "HK1" | "HK2" | "HK3";
      return order[hkA] - order[hkB];
    });
  }, [blocks]);

  const overview: Overview = useMemo(() => {
    if (!summary.length) return { cumulativeGpa: 0, totalCredits: 0 };
    const totalCredits = summary.reduce((s, x) => s + x.credits, 0);
    const weighted =
      totalCredits > 0 ? summary.reduce((s, x) => s + x.gpa * x.credits, 0) / totalCredits : 0;
    return { cumulativeGpa: Number(weighted.toFixed(2)), totalCredits };
  }, [summary]);

  const subjectsBySemester: Array<UiSemester & { subjects: UiSubject[] }> = useMemo(() => {
    if (!summary.length) return [];
    const map: Record<string, UiSemester> = Object.fromEntries(
      summary.map((s) => [s.id, s])
    );
    return blocks.map((blk) => {
      const id = `${blk.academic_year}-${blk.semester}`;
      const sem = map[id];
      const subjects = (blk.subjects ?? []).map(mapUiSubject);
      return { ...sem, subjects };
    });
  }, [blocks, summary]);

  const allSubjectsFlat: Array<UiSubject & { semesterId: string; semesterName: string }> =
    useMemo(() => {
      if (!subjectsBySemester.length) return [];
      return subjectsBySemester.flatMap((sem) =>
        sem.subjects.map((sub) => ({
          ...sub,
          semesterId: sem.id,
          semesterName: sem.name,
        }))
      );
    }, [subjectsBySemester]);

  /** Fetch */
  const fetchScores = useCallback(async (studentID: string) => {
    setLoading(true);
    setError(null);
    try {
      const raw = (await getScoresByStudentID(studentID)) as AnyPayload;
      const data = normalizeBlocks(raw);
        // Lấy info sinh viên từ block đầu tiên (nếu có)
        if (data.length > 0) {
            const firstBlk = data[0] as any;
            const info: StudentInfo = {
                student_id: firstBlk.student_id || firstBlk.studentId || "",
                name: firstBlk.name || firstBlk.fullName || "",
                class_name: firstBlk.class_name || firstBlk.className || "",
            };
            setStudentInfo(info);
        } else {
            setStudentInfo(null);
        }
      setBlocks(data);
    } catch (e) {
      console.error("[useScore] fetch error:", e);
      setBlocks([]);
      setError("Failed to fetch scores");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!stID) return;
    fetchScores(stID);
  }, [fetchScores, stID]);

  return {
    // trạng thái
    loading,
    error,

    // dữ liệu gốc nếu cần
    scores: blocks,

    // cho UI
    overview,
    summary,
    subjectsBySemester,
    allSubjectsFlat,
    studentInfo,

    // actions
    refetch: fetchScores,
  };
};
