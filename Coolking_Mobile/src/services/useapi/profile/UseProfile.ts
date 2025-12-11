import { getProfile , updateAvatar , changePassword , getUpdateProfile } from "@/src/services/api/profile/ProfileApi";
import { useState, useEffect, useRef, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isLoading } from "expo-font";

export const useProfile = () => {
 
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [profile, setProfile] = useState<any>(null);
    const [profileNavigation, setProfileNavigation] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [profileParent, setProfileParent] = useState<any[]>([]);
    const [profileStudent, setProfileStudent] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    
    const hasInitializedRef = useRef(false);
    const isFetchingRef = useRef(false);

    const labelMapStudent: Record<string, string> = {
        name: "Họ và tên",
        student_id: "Mã sinh viên",
        email: "Email",
        phone: "Số điện thoại",
        dob: "Ngày sinh",
        majorName: "Chuyên ngành",
        className: "Lớp",
        address: "Địa chỉ",
        gender: "Giới tính",
        facultyName: "Khoa"
    };
    const labelMapParent: Record<string, string> = {
        parent_id: "Mã phụ huynh",
        name: "Họ và tên",
        address: "Địa chỉ",
        email: "Email",
        phone: "Số điện thoại",
        dob: "Ngày sinh",
        gender : "Giới tính",
    };

    // ✅ Make fetchProfile a useCallback to ensure stability
    const fetchProfile = useCallback(async () => {
        // ✅ Prevent duplicate simultaneous requests
        if (isFetchingRef.current) return;
        
        try {
            isFetchingRef.current = true;
            setLoading(true);
            setError(null);
            
            const role = await AsyncStorage.getItem('role');
            if (!role) {
                throw new Error("No role found");
            }
            setRole(role);
            
            const data = await getProfile();
            if (!data){
                throw new Error("Invalid profile response"); 
                return;
            }
           
            let profileData = {};
            let navigationData = {};
            
            if (role === 'STUDENT') {
                profileData = {
                    name: data.name,
                    student_id: data.student_id,
                    className: data.className,
                    majorName: data.majorName,
                    email: data.email,
                    phone: data.phone,
                    address: data.address,
                    dob: data.dob,
                    gender: data.gender,
                };
                const parent = [];
                parent.push(data.parent);
                setProfileParent(parent);
                navigationData = {
                    name: data.name,
                    avatar: data?.avatar ,
                    student_id: data.student_id,
                };
                setAvatarUrl(data?.avatar);
            } else if (role === 'PARENT') {
                profileData = {
                    name: data.name,
                    address: data.address,
                    email: data.email,
                    phone: data.phone,
                    gender: data.gender,
                    dob: data.dob,
                };
                setProfileStudent(data.students);
                const studentMap = data.students.map((student: any) => ({
                    name: student.name,
                    student_id: student.student_id,
                }));
                setStudents(studentMap);
                navigationData = {
                    name: data.name,
                    avatar: data?.avatar,
                    parent_id: data.parent_id,
                };
                setAvatarUrl(data?.avatar);
            }
            
            setProfileNavigation(navigationData);
            setProfile(profileData);
        } catch (error) {
            setError("Failed to fetch profile");
            console.error("Fetch profile error:", error);
        } finally {
            setLoading(false);
            isFetchingRef.current = false;
        }
    }, []);

    // ✅ Initial fetch on mount
    useEffect(() => {
        if (!hasInitializedRef.current) {
            hasInitializedRef.current = true;
            fetchProfile();
        }
    }, [fetchProfile]);

    const getUpdateAvatar = async (file: any) => {
        try {
            if (!file) {
                throw new Error("No file provided");
            }
            const data = await updateAvatar(file);
            if (!data) {
                throw new Error("Invalid update avatar response");
            }
            return data;
            
        } catch (error) {
            setError("Failed to update avatar");
            console.error("Update avatar error:", error);
            throw error;
        }
    }

    const getchangePassword = async (currentPassword: string, newPassword: string) => {
        try {
            const data = await changePassword(currentPassword, newPassword);
            if (!data) {
                throw new Error("Invalid change password response");
            }
            return data;
            
        } catch (error) {
            setError("Failed to change password");
            console.error("Change password error:", error);
            throw error;
        }
    }

    const getUpdateProfileData = async (profileData: any) => {
        try {
            const data = await getUpdateProfile(profileData);
            if (!data) {
                throw new Error("Invalid update profile response");
            }
            return data;
        } catch (error) {
            setError("Failed to update profile");
            console.error("Update profile error:", error);
            throw error;
        }
    }

    return{
        profile,
        profileNavigation,
        labelMap: role === "STUDENT" ? labelMapStudent : labelMapParent,
        role,
        loading,
        isLoading: loading,
        error,
        getUpdateAvatar,
        avatarUrl,
        setAvatarUrl,
        getchangePassword,
        labelMapParent,
        labelMapStudent,
        profileParent,
        profileStudent,
        students,
        getUpdateProfileData,
        fetchProfile,
    }

}