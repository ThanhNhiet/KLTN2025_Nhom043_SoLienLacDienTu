import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Platform,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Calendar } from "react-native-calendars";
import dayjs from "dayjs";

import BottomNavigation from "@/src/components/navigations/BottomNavigations";
import TopNavigations_Calendar from "@/src/components/navigations/TopNavigations_Calendar";
import { useCalendar_Parent } from "@/src/services/useapi/calendar/UseCalender_Parent";

type Filter = "all" | "study" | "exam";

const getDayText = (day: number) => {
  const arr = ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return arr[day === 7 ? 0 : day - 1];
};

export default function CalendarScreen() {
  const navigation = useNavigation<any>();
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
  const [studentID, setStudentID] = useState<string | null>(null);
  
    const {
    loading,
    weekInfo,
    goPrevWeek,
    goNextWeek,
    getSchedulesByDate,
    getMarkedDates,
    fetchCalendar,
  } = useCalendar_Parent(studentID ? studentID : null);

    const handleGoToday = (id?: string) => {
      const todayISO = dayjs().format("YYYY-MM-DD");
      const todayForApi = dayjs().format("DD-MM-YYYY");
      setSelectedDate(todayISO);
      // gọi API tuần hiện tại
      fetchCalendar(todayForApi, id ? id : null);
    };



  // Lấy lịch trong ngày
  const dayEvents = useMemo(() => {
    const schedules = getSchedulesByDate(selectedDate);
    const filtered = schedules.filter((s) => {
      if (filter === "all") return true;
      if (filter === "study") return s.type !== "EXAM";
      if (filter === "exam") return s.type === "EXAM";
      return true;
    });

    return filtered.map((s) => ({
      id: s.id,
      title: s.subjectName,
      type: s.type === "EXAM" ? "exam" : "study",
      time: `Tiết ${s.start_lesson} - ${s.end_lesson}`,
      location: s.room,
      lecturer: s.lecturerName,
      status: s.status,
    }));
  }, [selectedDate, filter, getSchedulesByDate]);

  // Marked dates
  const marked = useMemo(() => {
    const base = getMarkedDates();
    return {
      ...base,
      [selectedDate]: {
        ...(base[selectedDate] || { dots: [] }),
        selected: true,
        selectedColor: "#007AFF",
      },
    };
  }, [getMarkedDates, selectedDate]);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor={Platform.OS === "android" ? "#f8f9fa" : "transparent"}
        />

        <TopNavigations_Calendar
          initialFilter={filter}
          onChangeFilter={(f: Filter) => setFilter(f)}
          setStudentID={setStudentID}
          handleGoToday={handleGoToday}
        />

        {/* Thanh chuyển tuần */}
        {studentID ? (
          <>
        <View style={styles.weekHeader}>
          <TouchableOpacity style={styles.weekBtn} onPress={goPrevWeek}>
            <Text style={styles.weekBtnText}>⏪ Tuần trước</Text>
          </TouchableOpacity>
            <View style={styles.weekCenter}>
              <Text style={styles.weekLabel} numberOfLines={1}>
                {weekInfo?.weekStart} → {weekInfo?.weekEnd}
              </Text>
              <TouchableOpacity style={styles.todayBtn} onPress={() => handleGoToday(studentID)}>
                <Text style={styles.todayText}>Hôm nay</Text>
              </TouchableOpacity>
            </View>
          <TouchableOpacity style={styles.weekBtn} onPress={goNextWeek}>
            <Text style={styles.weekBtnText}>Tuần sau ⏩</Text>
          </TouchableOpacity>
        </View>

        {/* Lịch */}
        <View style={styles.calendarWrap}>
          {loading ? (
            <ActivityIndicator style={{ padding: 20 }} size="large" color="#007AFF" />
          ) : (
            <Calendar
              current={selectedDate}
              onDayPress={(d) => setSelectedDate(d.dateString)}
              markedDates={marked}
              markingType="multi-dot"
              firstDay={1}
              theme={{
                todayTextColor: "#007AFF",
                selectedDayBackgroundColor: "#007AFF",
                selectedDayTextColor: "#fff",
                arrowColor: "#007AFF",
                monthTextColor: "#0f172a",
                textMonthFontWeight: "800",
                textDayHeaderFontWeight: "700",
              }}
              style={styles.calendar}
            />
          )}
        </View>

        {/* Danh sách sự kiện */}
        <View style={styles.listWrap}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>
              {getDayText(dayjs(selectedDate).day() || 7)},{" "}
              {dayjs(selectedDate).format("DD/MM/YYYY")}
            </Text>
            <Text style={styles.eventCount}>
              {dayEvents.length}{" "}
              {filter === "all"
                ? "sự kiện"
                : filter === "study"
                ? "lịch học"
                : "lịch thi"}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : dayEvents.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <FlatList
              data={dayEvents}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => <EventCard item={item} />}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16,paddingBottom: 20, }}
            />
          )}
        </View>
        </> ) : (
          <View style={styles.contentContainer}>
            <Text style={styles.centeredText}>
              Vui lòng chọn học sinh để xem lịch.
            </Text>
          </View>
        )}
        <View style={styles.bottomWrapper}>
        <BottomNavigation navigation={navigation} />
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// ================== CARD HIỂN THỊ ==================
function EventCard({ item }: { item: any }) {
  const isStudy = item.type === "study";
  const isPractical = /^TH/i.test(item?.location || "");

  const color = isStudy ? (isPractical ? "#22C55E" : "#2E86DE") : "#E74C3C";
  const bg = isStudy ? (isPractical ? "#EAFBF1" : "#E8F1FE") : "#FDECEC";
  const border = isStudy ? (isPractical ? "#BEF3D0" : "#C7DBF9") : "#FAC8C6";
  const typeLabel = isStudy ? (isPractical ? "Học TH" : "Học LT") : "Thi";

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.typePill, { backgroundColor: bg, borderColor: border }]}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={[styles.pillText, { color }]}>{typeLabel}</Text>
        </View>
        <Text style={styles.timeText}>{item.time}</Text>
      </View>

      <Text style={styles.titleText}>{item.title}</Text>
      <Text style={styles.subText}>
        {item.lecturer ? `Giảng viên: ${item.lecturer}` : " "}
      </Text>
      <Text style={styles.subText}>
        {item.location ? `Địa điểm: ${item.location}` : ""}
      </Text>
      <Text style={[styles.statusText, { color: "#10B981" }]}>{item.status}</Text>
    </View>
  );
}

// ================== EMPTY STATE ==================
function EmptyState({ filter }: { filter: Filter }) {
  const msg =
    filter === "all"
      ? "Không có sự kiện trong ngày này"
      : filter === "study"
      ? "Không có lịch học trong ngày này"
      : "Không có lịch thi trong ngày này";
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>Không có sự kiện</Text>
      <Text style={styles.emptyDesc}>{msg}</Text>
    </View>
  );
}

// ================== STYLES ==================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  contentContainer: {
    flex: 1, // 1. Chiếm hết không gian còn lại
    justifyContent: 'center', // 2. Căn giữa theo chiều dọc
    alignItems: 'center', // 3. Căn giữa theo chiều ngang
    padding: 20,
  },
  // Style cho text
  centeredText: {
    textAlign: 'center',
    fontSize: 25,
    color: '#6c0909ff',
    lineHeight: 24,
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  weekBtn: { padding: 4 },
  weekBtnText: { color: "#007AFF", fontWeight: "600" },

  calendarWrap: {
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  calendar: { borderRadius: 12 },

  listWrap: {
    flex: 1,
    paddingHorizontal: 0,      // 🔹 Giảm padding để card chiếm gần full width
    paddingTop: 12,
    paddingBottom: 78,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 14,       // 🔹 Canh đều hai bên
  },
  weekCenter: {
    flex: 1,
    flexDirection: 'column', // Quan trọng: Xếp các phần tử theo chiều dọc
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600', // Cho chữ to và đậm hơn một chút
    color: '#333',
    marginBottom: 6, // Tạo khoảng cách với nút bên dưới
  },
  todayBtn: {
    backgroundColor: '#e7f3ff', // Tạo nền màu xanh nhạt cho nút
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 20, // Bo tròn các góc để tạo thành hình viên thuốc
  },
  todayText: {
    color: '#007bff', // Cho chữ màu xanh dương đậm
    fontSize: 13,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0f172a",
  },
  eventCount: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },

   card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    //width: "100%",
    marginHorizontal: 4,
    //alignSelf: "center",
  },
  // Khoảng cách giữa các card
  listContent: {
    paddingBottom: 16,
  },

  // Nếu bạn dùng ItemSeparatorComponent
  separator: {
    height: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  pillText: { fontWeight: "800" },
  timeText: { color: "#334155", fontWeight: "700", marginBottom: 8 },
  titleText: { fontSize: 15, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  subText: { color: "#475569", fontWeight: "600" },
  statusText: { marginTop: 6, fontSize: 13, fontWeight: "600" },
  empty: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    marginTop: 8,
  },
  emptyTitle: { fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  emptyDesc: { color: "#64748b" },
  bottomWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    width: "100%",
    backgroundColor: "#FFFFFF",
  },
});
