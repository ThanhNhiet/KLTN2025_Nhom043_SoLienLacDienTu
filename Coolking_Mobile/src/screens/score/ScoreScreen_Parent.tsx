import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  ListRenderItem,
  ScrollView,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import TopNavigations_Score from "@/src/components/navigations/TopNavigations";
import { useScore_Parent } from "@/src/services/useapi/score/UseScore_Parent"; // giữ nguyên đường dẫn bạn đang dùng

/* ===== Types khớp hook ===== */
type UiSemester = { id: string; name: string; gpa: number; credits: number };
type UiSubject = {
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

/* ===== Enum tab ===== */
enum TabKey {
  Overview = "overview",
  Summary = "summary",
}

type StudentInfo = {
   student_id: string;
   name: string;
   class_name: string;
};


/* ===== Component con ===== */

const Row = ({
  label,
  value,
  emphasis,
  last,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
  last?: boolean;
}) => (
  <View style={[styles.infoRow, last && { marginBottom: 0 }]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={[styles.value, emphasis && { color: "#007AFF", fontWeight: "bold" }]}>{value}</Text>
  </View>
);

/* ===== Tổng quan (bám trên) ===== */
const OverviewContent = ({
  cumulativeGpa,
  totalCredits,
  studentInfo
}: {
  cumulativeGpa: number;
  totalCredits: number;
  studentInfo: StudentInfo | null;
}) => (
  <View style={styles.card}>
    <Text style={styles.sectionTitle}>I. Tổng quan</Text>
    <Row label="Họ và tên:" value={studentInfo?.name ?? ""} />
    <Row label="Mã số sinh viên:" value={studentInfo?.student_id ?? ""} />
    <Row label="Lớp học:" value={studentInfo?.class_name ?? ""} />
    <Row label="Điểm TBC tích lũy:" value={cumulativeGpa.toFixed(2)} emphasis />
    <Row label="Số tín chỉ tích lũy:" value={String(totalCredits)} last />
  </View>
);

/* ===== Tổng kết (FlatList ngoài: kỳ; FlatList trong: môn) ===== */
const SummaryContent = ({
  subjectsBySemester,
}: {
  subjectsBySemester: Array<UiSemester & { subjects: UiSubject[] }>;
}) => {
  const renderSubject: ListRenderItem<UiSubject> = ({ item }) => (
    <View style={styles.subjectRow}>
      <Text style={styles.subjectName}>{item.subject_name}</Text>
      <Text style={styles.subjectMeta}>
        Tín chỉ: {item.credits} · LT {item.theo_credit} · TH {item.pra_credit}
      </Text>

      <View style={styles.chipsWrap}>
        {item.average !== undefined && (
          <View style={[styles.chip, styles.chipInfo]}>
            <Text style={styles.chipText}>TB: {item.average}</Text>
          </View>
        )}
        {item.grade_point !== undefined && (
          <View style={[styles.chip, styles.chipPrimary]}>
            <Text style={[styles.chipText, styles.chipTextPrimary]}>Quy đổi(4): {item.grade_point}</Text>
          </View>
        )}
        {item.midterm !== undefined && (
          <View style={[styles.chip, styles.chipNeutral]}>
            <Text style={styles.chipText}>GK: {item.midterm}</Text>
          </View>
        )}
        {item.final !== undefined && (
          <View style={[styles.chip, styles.chipNeutral]}>
            <Text style={styles.chipText}>CK: {item.final}</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderSemester: ListRenderItem<UiSemester & { subjects: UiSubject[] }> = ({ item }) => (
    <View style={[styles.semCard, hkBorder(item.id)]}>
      <View style={styles.semHeader}>
        <Text style={styles.semTitle}>{item.name}</Text>
        <View style={styles.semChips}>
          <View style={[styles.chip, styles.chipPrimary, { marginRight: 8 }]}>
            <Text style={[styles.chipText, styles.chipTextPrimary]}>GPA: {item.gpa.toFixed(2)}</Text>
          </View>
          <View style={[styles.chip, styles.chipInfo]}>
            <Text style={styles.chipText}>TC: {item.credits}</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={item.subjects}
        keyExtractor={(sub, idx) => `${sub.subject_name ?? 'subject'}-${idx}`}
        renderItem={renderSubject}
        ItemSeparatorComponent={() => <View style={styles.itemDivider} />}
        scrollEnabled={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 8 }}
      />
    </View>
  );

  return (
  <FlatList
    data={subjectsBySemester}
    keyExtractor={(sem, index) => `${sem.id ?? sem.name ?? 'sem'}-${index}`}
    renderItem={renderSemester}
    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    // 👇 Không để paddingTop
    contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 20, paddingTop: 0 }}
    initialNumToRender={4}
    windowSize={8}
    removeClippedSubviews
    ListEmptyComponent={
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <Text style={{ color: "#666" }}>Chưa có dữ liệu điểm.</Text>
      </View>
    }
  />
);
};

/* ===== Helper màu viền theo kỳ ===== */
const hkBorder = (id: string) => {
  const hk = id.slice(-3); // "HK1" | "HK2" | "HK3"
  switch (hk) {
    case "HK1":
      return { borderLeftWidth: 3, borderLeftColor: "#0A66FF" };
    case "HK2":
      return { borderLeftWidth: 3, borderLeftColor: "#FF7A00" };
    case "HK3":
      return { borderLeftWidth: 3, borderLeftColor: "#7A5AF5" };
    default:
      return null as any;
  }
};

/* ======================= SCREEN ======================= */
export default function ScoreScreen_Parent() {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<TabKey>(TabKey.Overview);
  const [studentId, setStudentId] = useState<string>(""); // ID sinh viên cần xem điểm
  const { loading, error, overview, subjectsBySemester , studentInfo } = useScore_Parent(studentId ? studentId : ""); // truyền ID sinh viên vào hook

  let content: React.ReactNode;
  if (loading) {
    content = (
      <View style={{ paddingVertical: 24, alignItems: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#666" }}>Đang tải điểm...</Text>
      </View>
    );
  } else if (error) {
    content = (
      <View style={{ paddingVertical: 16 }}>
        <Text style={{ color: "red" }}>{error}</Text>
      </View>
    );
  } else if (activeTab === TabKey.Overview) {
    // ScrollView thường, KHÔNG center — sẽ bám trên
    content = (
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        <OverviewContent cumulativeGpa={overview.cumulativeGpa} totalCredits={overview.totalCredits} studentInfo={studentInfo} />
      </ScrollView>
    );
  } else {
    // FlatList tự scroll — bám trên
   content = <View style={{ flex: 1, marginTop: -6 }}>
                <SummaryContent subjectsBySemester={subjectsBySemester} />
             </View>;
  }

  return (
    <SafeAreaProvider>
  <SafeAreaView style={{ flex: 1, backgroundColor: "#f4f4f8" }}>
    <TopNavigations_Score 
      navigation={navigation} 
      name="Bảng điểm sinh viên"  
      setStudentId={setStudentId}
      />

    {/* GỘP tab + content chung 1 container, KHÔNG paddingTop */}
    <View style={styles.container}>
    {studentId ? (
      <>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === TabKey.Overview && styles.activeTab]}
          onPress={() => setActiveTab(TabKey.Overview)}
        >
          <Text style={[styles.tabText, activeTab === TabKey.Overview && styles.activeTabText]}>Tổng quan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === TabKey.Summary && styles.activeTab]}
          onPress={() => setActiveTab(TabKey.Summary)}
        >
          <Text style={[styles.tabText, activeTab === TabKey.Summary && styles.activeTabText]}>Tổng kết</Text>
        </TouchableOpacity>
      </View>

      {/* Content SÁT tab */}
      <View style={{ flex: 1 }}>
        {content}
      </View>
      </>
    ) : (
        <View style={{padding: 20}}>
            <Text style={{color: '#666'}}>Vui lòng chọn học sinh để xem bảng điểm.</Text>
        </View>
      )}
    </View>
  </SafeAreaView>
</SafeAreaProvider>

  );
}

/* ======================= STYLES ======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f4f8", paddingHorizontal: 16 },

  /* Tabs */
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#e9e9f0",
    borderRadius: 10,
    padding: 5,
    marginBottom: 16,
  },
  tabButton: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: "center" },
  activeTab: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  tabText: { fontSize: 16, fontWeight: "600", color: "#555" },
  activeTabText: { color: "#007AFF" },

  /* Overview */
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    paddingBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: { fontSize: 16, color: "#666" },
  value: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 10,
  },

  /* Summary */
  summaryContainer: {
    paddingHorizontal: 8,
    paddingBottom: 20, // chỉ padding, không center
  },
  semCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  semHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#ececec",
    backgroundColor: "#fafafa",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  semTitle: { fontWeight: "700", fontSize: 16, color: "#1c1c1e", flex: 1, paddingRight: 8 },
  semChips: { flexDirection: "row", alignItems: "center" },

  subjectRow: {
    backgroundColor: "#fff",
    paddingVertical: 12,
  },
  subjectName: { fontWeight: "600", color: "#1c1c1e", fontSize: 15, marginBottom: 4, paddingHorizontal: 4 },
  subjectMeta: { color: "#666", paddingHorizontal: 4 },

  itemDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#eee", marginHorizontal: 4 },

  chipsWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 4, marginTop: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    marginRight: 8,
    marginTop: 6,
    backgroundColor: "#f2f2f7",
    borderWidth: 1,
    borderColor: "#e6e6ea",
  },
  chipText: { fontSize: 12, color: "#333" },
  chipPrimary: { backgroundColor: "#EAF2FF", borderColor: "#D6E7FF" },
  chipTextPrimary: { color: "#0A66FF", fontWeight: "700" },
  chipInfo: { backgroundColor: "#F2FAFF", borderColor: "#DFF1FF" },
  chipNeutral: { backgroundColor: "#F7F7F9", borderColor: "#EBEBF0" },
});
