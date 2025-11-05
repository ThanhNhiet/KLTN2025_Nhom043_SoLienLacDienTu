import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getStoredCalendarData } from "@/src/services/api/calendar/CalendarApi";

dayjs.extend(customParseFormat);

// ================== TYPES ==================
export interface NewSchedule {
  id: string;
  subjectName: string;
  clazzName: string;
  lecturerName: string;
  type: string; // "REGULAR" | "EXAM"
  status: string;
  date: string; // "DD-MM-YYYY"
  day_of_week: number;
  room: string;
  start_lesson: number;
  end_lesson: number;
}

interface NewApiResp {
  schedules: NewSchedule[];
  prev?: string | null;
  next?: string | null;
  weekInfo?: {
    weekStart: string;
    weekEnd: string;
    currentDate: string;
  } | null;
}

// ================== HELPERS ==================
const parseDate = (str?: string | null) => {
  if (!str) return dayjs('invalid');
  const norm = String(str).trim().replace(/[/.]/g, "-");
  const d1 = dayjs(norm, "DD-MM-YYYY", true);
  return d1.isValid() ? d1 : dayjs(norm, "YYYY-MM-DD", true);
};

const toISO = (d: dayjs.Dayjs) => d.format("YYYY-MM-DD");

const isPracticalRoom = (room?: string | null) =>
  !!room && /^TH[\s\-_]?/i.test(room.trim());

// ================== MAIN HOOK ==================
export const useCalendar_Parent = (stID: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schedules, setSchedules] = useState<NewSchedule[]>([]);
  const [prev, setPrev] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [weekInfo, setWeekInfo] = useState<NewApiResp["weekInfo"]>(null);

  // ====== Fetch theo ngày ======
  const fetchCalendar = useCallback(async (date?: string, studentID?: string | null) => {
    try {
      if (!studentID) return;
      setLoading(true);
      setError(null);
      const current = date || dayjs().format("DD-MM-YYYY");
      const data = await getStoredCalendarData(current, studentID);

      if (!data) {
        throw new Error("No data received from API");
      }

      if (typeof data === 'string') {
        // If data is string, try to parse it
        try {
          const parsedData = JSON.parse(data);
          if (Array.isArray(parsedData?.schedules)) {
            setSchedules(parsedData.schedules);
            setPrev(parsedData.prev ?? null);
            setNext(parsedData.next ?? null);
            setWeekInfo(parsedData.weekInfo ?? null);
            return;
          }
        } catch (e) {
          throw new Error("Invalid JSON response");
        }
      }

      // Handle normal object response
      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (err) {
      console.error("❌ Fetch calendar error:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch calendar data");
      setSchedules([]);
      setPrev(null);
      setNext(null);
      setWeekInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCalendar(); // tự load tuần hiện tại
  }, [fetchCalendar]);

  // ====== Fetch theo prev/next ======
  const goPrevWeek = useCallback(async () => {
    if (!prev) return;
    try {
      setLoading(true);
      // lấy currentDate từ URL prev
      const dateParam = new URLSearchParams(prev.split("?")[1]).get("currentDate");
      if (!dateParam) return;
      const data = await getStoredCalendarData(dateParam, stID);
      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
      }
    } catch (e) {
      console.error("❌ goPrevWeek error:", e);
    } finally {
      setLoading(false);
    }
  }, [prev]);

  const goNextWeek = useCallback(async () => {
    if (!next) return;
    try {
      setLoading(true);
      const dateParam = new URLSearchParams(next.split("?")[1]).get("currentDate");
      if (!dateParam) return;
      const data = await getStoredCalendarData(dateParam, stID);
      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
      }
    } catch (e) {
      console.error("❌ goNextWeek error:", e);
    } finally {
      setLoading(false);
    }
  }, [next]);

  // ====== getSchedulesByDate ======
  const getSchedulesByDate = useCallback(
    (dateISO: string) =>
      schedules
        .filter((s) => {
          const d = parseDate(s.date);
          return d.isValid() && toISO(d) === dateISO;
        })
        .sort((a, b) => a.start_lesson - b.start_lesson),
    [schedules]
  );

  // ====== getMarkedDates ======
  const getMarkedDates = useCallback(() => {
    const marked: Record<string, { dots: { key: string; color: string }[] }> = {};

    schedules.forEach((s) => {
      const d = parseDate(s.date);
      if (!d.isValid()) return;
      const key = toISO(d);
      const isExam = s.type.toUpperCase() === "EXAM";
      const practical = isPracticalRoom(s.room);
      const color = isExam ? "#E74C3C" : practical ? "#22C55E" : "#2E86DE";
      const dotKey = `${isExam ? "exam" : practical ? "studyTH" : "studyLT"}-${s.id}`;

      if (!marked[key]) marked[key] = { dots: [] };
      marked[key].dots.push({ key: dotKey, color });
    });

    return marked;
  }, [schedules]);

  // ====== RETURN ======
  return {
    loading,
    error,
    schedules,
    weekInfo,
    prev,
    next,
    fetchCalendar,
    goPrevWeek,
    goNextWeek,
    getSchedulesByDate,
    getMarkedDates,
  };
};
