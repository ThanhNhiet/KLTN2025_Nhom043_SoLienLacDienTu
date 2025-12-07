import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { getCalendarExamsAndStudy } from "@/src/services/api/calendar/CalendarApi";

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
export const useCalendar = () => {
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<NewSchedule[]>([]);
  const [prev, setPrev] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [weekInfo, setWeekInfo] = useState<NewApiResp["weekInfo"]>(null);
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));

  // ====== Fetch theo ngày ======
  const fetchCalendar = useCallback(async (date?: string) => {
    try {
      setLoading(true);
      const current = date || dayjs().format("DD-MM-YYYY"); // mặc định hôm nay
      const data = await getCalendarExamsAndStudy(current);

      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
      } else {
        setSchedules([]);
        setPrev(null);
        setNext(null);
        setWeekInfo(null);
      }
    } catch (err) {
      console.error("❌ Fetch calendar error:", err);
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
      const data = await getCalendarExamsAndStudy(dateParam);
      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
        setSelectedDate(dayjs(dateParam, "DD-MM-YYYY").format("YYYY-MM-DD"));
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
      const data = await getCalendarExamsAndStudy(dateParam);
      if (Array.isArray(data?.schedules)) {
        setSchedules(data.schedules);
        setPrev(data.prev ?? null);
        setNext(data.next ?? null);
        setWeekInfo(data.weekInfo ?? null);
        setSelectedDate(dayjs(dateParam, "DD-MM-YYYY").format("YYYY-MM-DD"));
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
    schedules,
    weekInfo,
    prev,
    next,
    selectedDate,
    setSelectedDate,
    fetchCalendar,
    goPrevWeek,
    goNextWeek,
    getSchedulesByDate,
    getMarkedDates,
  };
};
