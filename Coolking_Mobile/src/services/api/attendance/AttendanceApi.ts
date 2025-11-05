import axiosInstance from "@/src/configs/axiosInstance";

export const getCourseSectionsByStudent = async (page: number, pageSize: number) => {
    try {
        const response = await axiosInstance.get(`/api/coursesections/student?page=${page}&pageSize=${pageSize}`);
        if(!response.data){
            throw new Error("No data received");
        }
        return response.data;
    }catch (error) {
        console.error("Error fetching course sections:", error);
        throw error;
    }
}

export const getAttendanceByStudentBySubject = async (courseSectionId: string, subjectId: string) => {
    try {
        const response = await axiosInstance.get(`/api/attendances/student`, {
            params: {
                course_section_id: courseSectionId,
                subject_id: subjectId,
            },
        });
        if(!response.data){
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching attendance details:", error);
        throw error;
    }
};

///api/attendances/parent/SV2100001?page=1&pagesize=10
export const getAttendanceByStudentBySubject_Parent = async (stID: string , page:number, pageSize:number) => {
    try {
        // Sửa ở đây: pageSize -> pagesize
        const response = await axiosInstance.get(
            `/api/attendances/parent/${stID}?page=${page}&pagesize=${pageSize}` 
        );
        
        if(!response.data){
            throw new Error("No data received");
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching attendance details:", error);
        throw error;
    }
};
