import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface GradeDistribution {
  excellent: number;
  good: number;
  fair: number;
  poor: number;
  fail: number;
}

interface FacultyStatisticsData {
  faculty_id: string;
  faculty_name: string;
  session_name: string;
  total_subjects: number;
  total_course_sections: number;
  total_lecturers: number;
  total_students: number;
  students_with_scores: number;
  students_passed: number;
  pass_rate: number;
  average_score: number;
  attendance_rate: number;
  grade_distribution: GradeDistribution;
}

interface Props {
  data: FacultyStatisticsData;
}

const FacultyStatisticsChart: React.FC<Props> = ({ data }) => {
  // Safety check for data structure
  if (!data || typeof data !== 'object') {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Dữ liệu không hợp lệ</h3>
          <p className="text-gray-500">Dữ liệu thống kê khoa không đúng định dạng. Vui lòng thử lại.</p>
        </div>
      </div>
    );
  }

  // Export to PDF
  const exportToPDF = async () => {
  const element = document.getElementById('faculty-statistics-chart');
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');

    const margin = 10; // 10mm lề cho tất cả các bên
    const pageRealHeight = pdf.internal.pageSize.getHeight();
    const pageRealWidth = pdf.internal.pageSize.getWidth();
    
    const imgWidth = pageRealWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const usablePageHeight = pageRealHeight - margin * 2;
    
    let heightLeft = imgHeight; // Chiều cao ảnh còn lại
    let position = margin;      // Vị trí Y ban đầu (bắt đầu từ lề trên)

    pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);

    // Tính toán chiều cao ảnh còn lại sau khi lấp đầy trang 1
    heightLeft -= usablePageHeight;

    // 3. Vòng lặp phân trang (nếu ảnh vẫn còn)
    while (heightLeft > 0) {
      // Cập nhật 'position' cho trang tiếp theo. Cắt tấm ảnh lên trên bằng cách trừ đi toàn bộ chiều cao của trang bao gồm cả lề
      position -= pageRealHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
      heightLeft -= usablePageHeight;
    }

    pdf.save(`Thong-ke-khoa-${data.faculty_id}-${data.session_name}.pdf`);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Có lỗi xảy ra khi xuất PDF. Vui lòng thử lại.');
  }
};

  // Export to CSV function
  const exportToCSV = () => {
    try {
      // Prepare data for CSV
      const csvData = [
        ['THỐNG KÊ KHOA'],
        ['Khoa:', data.faculty_name],
        ['Mã khoa:', data.faculty_id],
        ['Học kỳ:', data.session_name],
        [''],
        ['THỐNG KÊ TỔNG QUAN'],
        ['Chỉ tiêu', 'Giá trị'],
        ['Tổng số môn học', data.total_subjects],
        ['Tổng lớp học phần', data.total_course_sections],
        ['Tổng giảng viên', data.total_lecturers],
        ['Tổng sinh viên', data.total_students],
        ['Sinh viên có điểm', data.students_with_scores],
        ['Sinh viên đậu', data.students_passed],
        [''],
        ['HIỆU SUẤT HỌC TẬP'],
        ['Chỉ tiêu', 'Giá trị'],
        ['Tỷ lệ đậu (%)', data.pass_rate],
        ['Điểm trung bình', data.average_score],
        ['Tỷ lệ điểm danh (%)', data.attendance_rate],
        [''],
        ['PHÂN BỐ ĐIỂM SỐ'],
        ['Loại điểm', 'Số lượng', 'Tỷ lệ (%)'],
        ['Xuất sắc (8.5-10)', data.grade_distribution.excellent, ((data.grade_distribution.excellent / Object.values(data.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Giỏi (7.0-8.4)', data.grade_distribution.good, ((data.grade_distribution.good / Object.values(data.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Khá (5.5-6.9)', data.grade_distribution.fair, ((data.grade_distribution.fair / Object.values(data.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Trung bình (4.0-5.4)', data.grade_distribution.poor, ((data.grade_distribution.poor / Object.values(data.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)],
        ['Yếu (<4.0)', data.grade_distribution.fail, ((data.grade_distribution.fail / Object.values(data.grade_distribution).reduce((sum, count) => sum + count, 0)) * 100).toFixed(1)]
      ];

      // Convert array to CSV string
      const csvContent = csvData.map(row => 
        row.map(cell => {
          // Handle cells containing commas, quotes, or newlines
          const cellStr = String(cell);
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      ).join('\n');

      // Add UTF-8 BOM for proper encoding
      const BOM = '\uFEFF';
      const csvWithBOM = BOM + csvContent;

      // Create and download file
      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Thong-ke-khoa-${data.faculty_id}-${data.session_name}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating CSV:', error);
      alert('Có lỗi xảy ra khi xuất CSV. Vui lòng thử lại.');
    }
  };

  const {
    faculty_name,
    session_name,
    total_subjects,
    total_course_sections,
    total_lecturers,
    total_students,
    students_with_scores,
    students_passed,
    pass_rate,
    average_score,
    attendance_rate,
    grade_distribution
  } = data;

  // Calculate percentages for grade distribution chart
  const totalGrades = Object.values(grade_distribution).reduce((sum, count) => sum + count, 0);
  const gradePercentages = totalGrades > 0 ? {
    excellent: (grade_distribution.excellent / totalGrades) * 100,
    good: (grade_distribution.good / totalGrades) * 100,
    fair: (grade_distribution.fair / totalGrades) * 100,
    poor: (grade_distribution.poor / totalGrades) * 100,
    fail: (grade_distribution.fail / totalGrades) * 100
  } : { excellent: 0, good: 0, fair: 0, poor: 0, fail: 0 };

  const statsCards = [
    {
      label: 'Tổng số môn học',
      value: total_subjects,
      icon: '📚',
      color: 'bg-blue-500'
    },
    {
      label: 'Tổng lớp học phần',
      value: total_course_sections,
      icon: '🏛️',
      color: 'bg-green-500'
    },
    {
      label: 'Tổng giảng viên',
      value: total_lecturers,
      icon: '👨‍🏫',
      color: 'bg-purple-500'
    },
    {
      label: 'Tổng sinh viên',
      value: total_students,
      icon: '👥',
      color: 'bg-orange-500'
    },
    {
      label: 'Sinh viên có điểm',
      value: students_with_scores,
      icon: '📊',
      color: 'bg-cyan-500'
    },
    {
      label: 'Sinh viên đậu',
      value: students_passed,
      icon: '✅',
      color: 'bg-emerald-500'
    }
  ];

  const performanceMetrics = [
    {
      label: 'Tỷ lệ đậu',
      value: `${pass_rate}%`,
      icon: '🎯',
      color: pass_rate >= 80 ? 'text-green-600' : pass_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      label: 'Điểm trung bình',
      value: average_score.toFixed(2),
      icon: '📈',
      color: average_score >= 7 ? 'text-green-600' : average_score >= 5.5 ? 'text-yellow-600' : 'text-red-600'
    },
    {
      label: 'Tỷ lệ điểm danh',
      value: `${attendance_rate}%`,
      icon: '📅',
      color: attendance_rate >= 80 ? 'text-green-600' : attendance_rate >= 60 ? 'text-yellow-600' : 'text-red-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Export Buttons */}
      <div className="flex justify-end gap-3 mb-4">
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất CSV
        </button>
        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Xuất PDF
        </button>
      </div>

      {/* Statistics Content */}
      <div id="faculty-statistics-chart" className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
          <h2 className="text-2xl font-bold mb-2">Thống kê Khoa</h2>
          <p className="text-blue-100">
            <span className="font-semibold">{faculty_name}</span> - {session_name}
          </p>
        </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <div className={`${card.color} w-3 h-3 rounded-full`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-800 mb-1">
              {card.value.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {performanceMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <span className="text-2xl mr-3">{metric.icon}</span>
                <h3 className="text-lg font-semibold text-gray-800">{metric.label}</h3>
              </div>
            </div>
            <div className={`text-3xl font-bold ${metric.color}`}>
              {metric.value}
            </div>
          </div>
        ))}
      </div>

      {/* Grade Distribution Chart */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Phân bố điểm số</h3>
        
        {/* Chart Bars */}
        <div className="space-y-4 mb-6">
          {[
            { key: 'excellent', label: 'Xuất sắc (8.5-10)', color: 'bg-green-500', count: grade_distribution.excellent },
            { key: 'good', label: 'Giỏi (7.0-8.4)', color: 'bg-blue-500', count: grade_distribution.good },
            { key: 'fair', label: 'Khá (5.5-6.9)', color: 'bg-yellow-500', count: grade_distribution.fair },
            { key: 'poor', label: 'Trung bình (4.0-5.4)', color: 'bg-orange-500', count: grade_distribution.poor },
            { key: 'fail', label: 'Yếu (<4.0)', color: 'bg-red-500', count: grade_distribution.fail }
          ].map((grade) => (
            <div key={grade.key} className="flex items-center">
              <div className="w-32 text-sm font-medium text-gray-700 mr-4">
                {grade.label}
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                <div
                  className={`${grade.color} h-6 rounded-full transition-all duration-500 ease-out`}
                  style={{ width: `${gradePercentages[grade.key as keyof typeof gradePercentages]}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white">
                  {grade.count} ({gradePercentages[grade.key as keyof typeof gradePercentages].toFixed(1)}%)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Grade Distribution Summary */}
        <div className="border-t pt-4">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {Object.entries(grade_distribution).map(([key, value]) => {
              const labels: Record<string, string> = {
                excellent: 'Xuất sắc',
                good: 'Giỏi',
                fair: 'Khá',
                poor: 'Trung bình',
                fail: 'Yếu'
              };
              const colors: Record<string, string> = {
                excellent: 'text-green-600',
                good: 'text-blue-600',
                fair: 'text-yellow-600',
                poor: 'text-orange-600',
                fail: 'text-red-600'
              };
              return (
                <div key={key} className="text-center">
                  <div className={`text-2xl font-bold ${colors[key]}`}>
                    {value}
                  </div>
                  <div className="text-sm text-gray-600">{labels[key]}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default FacultyStatisticsChart;
