import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HeaderLeCpn from '../../../components/lecturer/HeaderLeCpn';
import FooterLeCpn from '../../../components/lecturer/FooterLeCpn';
import { useSchedule, type Schedule } from '../../../hooks/useSchedule';
import { useStatistics } from '../../../hooks/useStatistics';

// Custom styles for react-datepicker
const datePickerStyles = `
  .react-datepicker-wrapper {
    width: auto;
  }
  .react-datepicker__input-container input {
    width: 120px;
    text-align: center;
    font-size: 0.875rem;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    outline: none;
    cursor: pointer;
  }
  .react-datepicker__input-container input:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
  
  @media (max-width: 640px) {
    .react-datepicker__input-container input {
      width: 100px;
      padding: 0.375rem 0.5rem;
      font-size: 0.75rem;
    }
  }
`;

const SchedulePage: React.FC = () => {
    const { loading, error, schedules, linkPrev, linkNext, weekStart, getSchedulesByUser } = useSchedule();
    const { sessions, fetchAllSessions } = useStatistics();
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSession, setSelectedSession] = useState<string>('');
    const [sessionSearch, setSessionSearch] = useState<string>('');
    const [showSessionDropdown, setShowSessionDropdown] = useState<boolean>(false);

    // Fetch sessions on mount and set latest session as default
    useEffect(() => {
        const loadSessions = async () => {
            await fetchAllSessions();
        };
        loadSessions();
    }, [fetchAllSessions]);

    // Get current session based on current date
    const getCurrentSessionId = (): string => {
        if (sessions.length === 0) return '';
        
        const today = new Date();
        const currentMonth = today.getMonth() + 1; // getMonth() returns 0-11
        const currentYear = today.getFullYear();
        
        let targetSessionName = '';
        
        // Determine which semester based on current date
        if (currentMonth >= 8 && currentMonth <= 12) {
            // August to December: HK1 of current academic year
            targetSessionName = `HK1 ${currentYear}-${currentYear + 1}`;
        } else if (currentMonth >= 1 && currentMonth <= 5) {
            // January to May: HK2 of previous academic year
            targetSessionName = `HK2 ${currentYear - 1}-${currentYear}`;
        } else if (currentMonth === 6 || currentMonth === 7) {
            // June to July: HK3 of previous academic year
            targetSessionName = `HK3 ${currentYear - 1}-${currentYear}`;
        }
        
        // Find session that matches the target session name
        const currentSession = sessions.find(session => 
            session.nameSession === targetSessionName
        );
        
        return currentSession ? currentSession.id : (sessions[0]?.id || '');
    };

    // Set current session as default when sessions are loaded
    useEffect(() => {
        if (sessions.length > 0 && !selectedSession) {
            const currentSessionId = getCurrentSessionId();
            setSelectedSession(currentSessionId);
        }
    }, [sessions, selectedSession]);

    // Handle click outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.session-dropdown')) {
                setShowSessionDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Khởi tạo với ngày hiện tại
    useEffect(() => {
        const today = new Date();
        const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        setSelectedDate(formattedToday);
        getSchedulesByUser(formattedToday);
    }, [getSchedulesByUser]);



    // Chuyển đổi định dạng ngày từ dd-MM-yyyy sang dd/MM/yyyy
    const convertDateFormat = (dateString: string): string => {
        if (!dateString) return '';
        return dateString.replace(/-/g, '/');
    };

    // Chuyển đổi từ string dd/MM/yyyy sang Date object
    const convertStringToDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        }
        return null;
    };

    // Chuyển đổi từ Date object sang string dd/MM/yyyy
    const convertDateToString = (date: Date): string => {
        if (!date) return '';
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Get session name by ID
    const getSessionName = (sessionId: string): string => {
        const session = sessions.find(s => s.id === sessionId);
        return session ? session.nameSession : '';
    };

    // Get default date for session based on session name
    const getSessionDefaultDate = (sessionName: string): string => {
        if (!sessionName) return '';
        
        // Extract academic year from session name (e.g., "HK1 2025-2026")
        const yearMatch = sessionName.match(/(\d{4})-(\d{4})/);
        if (!yearMatch) return '';
        
        const startYear = parseInt(yearMatch[1]);
        
        if (sessionName.includes('HK1')) {
            return `01/08/${startYear}`; // August 1st of start year
        } else if (sessionName.includes('HK2')) {
            return `01/01/${startYear + 1}`; // January 1st of next year
        } else if (sessionName.includes('HK3')) {
            return `01/06/${startYear + 1}`; // June 1st of next year
        }
        
        return '';
    };

    // Handle session selection
    const handleSessionSelect = (sessionId: string) => {
        setSelectedSession(sessionId);
        setSessionSearch('');
        setShowSessionDropdown(false);
        
        const sessionName = getSessionName(sessionId);
        if (sessionName) {
            const defaultDate = getSessionDefaultDate(sessionName);
            if (defaultDate) {
                setSelectedDate(defaultDate);
                getSchedulesByUser(defaultDate);
            }
        }
    };

    // Filter sessions for dropdown
    const filteredSessions = sessions.filter(session =>
        session.nameSession.toLowerCase().includes(sessionSearch.toLowerCase())
    );



    // Xử lý nút tuần trước
    const handlePrevWeek = () => {
        if (linkPrev) {
            const urlParams = new URLSearchParams(linkPrev.split('?')[1]);
            const prevDate = urlParams.get('currentDate');
            if (prevDate) {
                const formattedDate = convertDateFormat(prevDate);
                setSelectedDate(formattedDate);
                getSchedulesByUser(formattedDate);
            }
        }
    };

    // Xử lý nút tuần sau
    const handleNextWeek = () => {
        if (linkNext) {
            const urlParams = new URLSearchParams(linkNext.split('?')[1]);
            const nextDate = urlParams.get('currentDate');
            if (nextDate) {
                const formattedDate = convertDateFormat(nextDate);
                setSelectedDate(formattedDate);
                getSchedulesByUser(formattedDate);
            }
        }
    };

    // Xử lý click vào ô ngày để chuyển trực tiếp đến ngày đó
    // const handleDateCellClick = (dayDate: Date) => {
    //     const formattedDate = `${dayDate.getDate().toString().padStart(2, '0')}/${(dayDate.getMonth() + 1).toString().padStart(2, '0')}/${dayDate.getFullYear()}`;
    //     setSelectedDate(formattedDate);
    //     getSchedulesByUser(formattedDate);
    // };

    // Xử lý nút "Hiện tại" để chuyển về ngày hôm nay
    const handleTodayClick = () => {
        const today = new Date();
        const formattedToday = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
        setSelectedDate(formattedToday);
        getSchedulesByUser(formattedToday);
    };

    // Xử lý click vào ô ngày để chuyển trực tiếp đến ngày đó
    const handleDateCellClick = (dayDate: Date) => {
        const formattedDate = `${dayDate.getDate().toString().padStart(2, '0')}/${(dayDate.getMonth() + 1).toString().padStart(2, '0')}/${dayDate.getFullYear()}`;
        setSelectedDate(formattedDate);
        getSchedulesByUser(formattedDate);
    };

    // Lấy màu sắc cho từng loại lịch
    const getScheduleColor = (schedule: Schedule): string => {
        if (schedule.type === 'EXAM') {
            return 'bg-yellow-200 border-yellow-400 text-yellow-800'; // Vàng - Lịch thi
        }
        if (schedule.status === 'CANCELED') {
            return 'bg-red-200 border-red-400 text-red-800'; // Đỏ - Lịch tạm ngưng
        }
        if (schedule.type !== 'EXAM' && schedule.room.startsWith('TH_')) {
            return 'bg-green-200 border-green-400 text-green-800'; // Xanh lá - Lịch thực hành
        }
        if (schedule.type !== 'EXAM' && !schedule.room.startsWith('TH_')) {
            return 'bg-gray-200 border-gray-400 text-gray-800'; // Xám - Lịch lý thuyết
        }
        return 'bg-blue-200 border-blue-400 text-blue-800'; // Mặc định
    };

    // Lấy nhãn loại lịch
    const getScheduleTypeLabel = (schedule: Schedule): string => {
        if (schedule.type === 'EXAM') return 'Lịch thi';
        if (schedule.status === 'CANCELED') return 'Lịch tạm ngưng';
        if (schedule.type !== 'EXAM' && schedule.room.startsWith('TH_')) return 'Lịch học thực hành';
        if (schedule.type !== 'EXAM' && !schedule.room.startsWith('TH_')) return 'Lịch học lý thuyết';
        return 'Lịch học';
    };

    // Lấy tên ngày trong tuần
    const getDayName = (dayOfWeek: number): string => {
        const days: Record<number, string> = {
            1: 'Thứ 2',
            2: 'Thứ 3',
            3: 'Thứ 4',
            4: 'Thứ 5',
            5: 'Thứ 6',
            6: 'Thứ 7',
            7: 'Chủ nhật'
        };
        return days[dayOfWeek] || 'N/A';
    };

    // Sắp xếp lịch theo ngày và tiết
    const groupedSchedules = schedules.reduce((acc, schedule) => {
        const dayKey = schedule.day_of_week;
        if (!acc[dayKey]) acc[dayKey] = [];
        acc[dayKey].push(schedule);
        return acc;
    }, {} as Record<number, Schedule[]>);

    // Sắp xếp lịch trong mỗi ngày theo tiết học
    Object.keys(groupedSchedules).forEach(day => {
        groupedSchedules[parseInt(day)].sort((a, b) => a.start_lesson - b.start_lesson);
    });

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <style dangerouslySetInnerHTML={{ __html: datePickerStyles }} />
            <HeaderLeCpn />

            <main className="flex-1 max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-8 w-full">
                <div className="bg-white rounded-lg shadow-sm border">
                    {/* Header */}
                    <div className="px-3 md:px-6 py-4 border-b border-gray-200">
                        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                            {/* Legend - Hidden on mobile */}
                            <div className="hidden lg:flex items-center gap-4 text-sm">
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-gray-200 border border-gray-400 rounded"></div>
                                    <span>Lý thuyết</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-green-200 border border-green-400 rounded"></div>
                                    <span>Thực hành</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                                    <span>Trực tuyến</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-yellow-200 border border-yellow-400 rounded"></div>
                                    <span>Thi</span>
                                </span>
                                <span className="flex items-center gap-1">
                                    <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                                    <span>Tạm ngưng</span>
                                </span>
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                                {/* Session Dropdown */}
                                <div className="relative session-dropdown min-w-[200px]">
                                    
                                    <div className="relative">
                                        <input
                                            type="text"
                                            placeholder="Tìm và chọn học kỳ..."
                                            value={selectedSession ? getSessionName(selectedSession) : sessionSearch}
                                            onChange={(e) => {
                                                setSessionSearch(e.target.value);
                                                if (selectedSession && e.target.value !== getSessionName(selectedSession)) {
                                                    setSelectedSession('');
                                                }
                                            }}
                                            onFocus={() => setShowSessionDropdown(true)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                                        />
                                        {showSessionDropdown && (
                                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                                {filteredSessions.length > 0 ? (
                                                    filteredSessions.map((session) => (
                                                        <div
                                                            key={session.id}
                                                            onClick={() => handleSessionSelect(session.id)}
                                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                        >
                                                            <div className="font-medium text-gray-900">{session.nameSession}</div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-3 py-2 text-gray-500 text-center">
                                                        Không tìm thấy học kỳ nào
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Date picker */}
                                <div className="flex items-center gap-2">
                                    <DatePicker
                                        selected={convertStringToDate(selectedDate)}
                                        onChange={(date: Date | null) => {
                                            if (date) {
                                                const formattedDate = convertDateToString(date);
                                                setSelectedDate(formattedDate);
                                                getSchedulesByUser(formattedDate);
                                            }
                                        }}
                                        dateFormat="dd/MM/yyyy"
                                        placeholderText="dd/MM/yyyy"
                                        showYearDropdown
                                        showMonthDropdown
                                        dropdownMode="select"
                                        autoComplete="off"
                                    />
                                    <button
                                        onClick={handleTodayClick}
                                        className="px-2 py-2 md:px-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm whitespace-nowrap"
                                    >
                                        📅 Hiện tại
                                    </button>
                                </div>

                                {/* Navigation buttons */}
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handlePrevWeek}
                                        disabled={!linkPrev}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        ←
                                    </button>
                                    <button
                                        onClick={handleNextWeek}
                                        disabled={!linkNext}
                                        className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                    >
                                        →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Content */}
                    <div className="p-3 md:p-6">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                <span className="ml-2">Đang tải lịch...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center py-12 text-red-600">
                                Lỗi: {error}
                            </div>
                        ) : (
                            <>
                                {/* Desktop Grid View */}
                                <div className="hidden md:block">
                                    <div className="grid grid-cols-8 gap-1 h-auto overflow-x-auto">
                                        {/* Header row */}
                                        <div className="bg-yellow-100 border border-gray-300 p-2 text-center font-medium text-sm">
                                            Ca học
                                        </div>
                                        {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek, index) => {
                                            let dayDate = new Date();

                                            if (weekStart) {
                                                const [day, month, year] = weekStart.split('-');
                                                const mondayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                                dayDate = new Date(mondayDate);
                                                dayDate.setDate(mondayDate.getDate() + index);
                                            }

                                            return (
                                                <div
                                                    key={dayOfWeek}
                                                    className="bg-blue-100 border border-gray-300 p-2 text-center"
                                                >
                                                    <div className="font-medium text-sm">{getDayName(dayOfWeek)}</div>
                                                    <div className="text-xs">
                                                        {dayDate.getDate().toString().padStart(2, '0')}/{(dayDate.getMonth() + 1).toString().padStart(2, '0')}/{dayDate.getFullYear()}
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Time slots */}
                                        {['Sáng', 'Chiều', 'Tối'].map((period, periodIndex) => (
                                            <React.Fragment key={period}>
                                                <div className="bg-yellow-100 border border-gray-300 p-2 text-center font-medium text-sm">
                                                    {period}
                                                </div>
                                                {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => {
                                                    const daySchedules = groupedSchedules[dayOfWeek] || [];
                                                    const periodSchedules = daySchedules.filter(schedule => {
                                                        if (periodIndex === 0) return schedule.start_lesson >= 1 && schedule.start_lesson <= 6;
                                                        if (periodIndex === 1) return schedule.start_lesson >= 7 && schedule.start_lesson <= 12;
                                                        return schedule.start_lesson >= 13;
                                                    });

                                                    return (
                                                        <div key={`${dayOfWeek}-${period}`} className="border border-gray-300 p-1 min-h-[80px]">
                                                            {periodSchedules.map((schedule, index) => (
                                                                <div
                                                                    key={index}
                                                                    className={`mb-1 p-1 rounded text-xs border ${getScheduleColor(schedule)}`}
                                                                >
                                                                    <div className="font-medium truncate">{schedule.subjectName}</div>
                                                                    <div className="truncate">{schedule.clazzName}</div>
                                                                    <div>Phòng: {schedule.room}</div>
                                                                    <div>Tiết: {schedule.start_lesson}-{schedule.end_lesson}</div>
                                                                    <div className="truncate">GV: {schedule.lecturerName}</div>
                                                                    {schedule.type === 'MAKEUP' && (
                                                                        <div className="text-xs text-blue-600 font-medium">Học bù</div>
                                                                    )}
                                                                    {schedule.status === 'ROOM_CHANGED' && (
                                                                        <div className="text-xs text-orange-600 font-medium">Đổi phòng</div>
                                                                    )}
                                                                    {schedule.status === 'LECTURER_CHANGED' && (
                                                                        <div className="text-xs text-purple-600 font-medium">Đổi GV</div>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile List View */}
                                <div className="block md:hidden">
                                    {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek, index) => {
                                        let dayDate = new Date();

                                        if (weekStart) {
                                            const [day, month, year] = weekStart.split('-');
                                            const mondayDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                                            dayDate = new Date(mondayDate);
                                            dayDate.setDate(mondayDate.getDate() + index);
                                        }

                                        const daySchedules = groupedSchedules[dayOfWeek] || [];

                                        return (
                                            <div key={dayOfWeek} className="mb-6">
                                                <div
                                                    className="bg-blue-100 p-3 rounded-t-lg border-b-2 border-blue-300 cursor-pointer"
                                                    onClick={() => handleDateCellClick(dayDate)}
                                                >
                                                    <h3 className="font-semibold text-lg text-blue-800">{getDayName(dayOfWeek)}</h3>
                                                    <p className="text-sm text-blue-600">
                                                        {dayDate.getDate().toString().padStart(2, '0')}/{(dayDate.getMonth() + 1).toString().padStart(2, '0')}/{dayDate.getFullYear()}
                                                    </p>
                                                </div>

                                                <div className="bg-white border border-gray-200 rounded-b-lg">
                                                    {daySchedules.length > 0 ? (
                                                        <div className="divide-y divide-gray-200">
                                                            {daySchedules.map((schedule, index) => (
                                                                <div key={index} className="p-4">
                                                                    <div className={`p-3 rounded-lg ${getScheduleColor(schedule)}`}>
                                                                        <div className="flex justify-between items-start mb-2">
                                                                            <h4 className="font-semibold text-base">{schedule.subjectName}</h4>
                                                                            <span className="text-sm font-medium">
                                                                                Tiết {schedule.start_lesson}-{schedule.end_lesson}
                                                                            </span>
                                                                        </div>
                                                                        <div className="space-y-1 text-sm">
                                                                            <div><strong>Lớp:</strong> {schedule.clazzName}</div>
                                                                            <div><strong>Phòng:</strong> {schedule.room}</div>
                                                                            <div><strong>GV:</strong> {schedule.lecturerName}</div>
                                                                            <div><strong>Loại:</strong> {getScheduleTypeLabel(schedule)}</div>
                                                                            {schedule.type === 'MAKEUP' && (
                                                                                <div className="text-blue-600 font-medium">• Học bù</div>
                                                                            )}
                                                                            {schedule.status === 'ROOM_CHANGED' && (
                                                                                <div className="text-orange-600 font-medium">• Đổi phòng</div>
                                                                            )}
                                                                            {schedule.status === 'LECTURER_CHANGED' && (
                                                                                <div className="text-purple-600 font-medium">• Đổi giảng viên</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-4 text-center text-gray-500">
                                                            Không có lịch học
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>



            <FooterLeCpn />
        </div>
    );
};

export default SchedulePage;
