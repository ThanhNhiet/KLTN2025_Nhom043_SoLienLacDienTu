import axiosInstance from "@/src/configs/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const getScores = async () => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    const role = await AsyncStorage.getItem("role");
    if (!userId) {
      throw new Error("User ID not found in storage");
    }
    if (!role ) {
        throw new Error("Role not found in storage");
    }
    let URL = '';
    if(role === 'STUDENT'){
        URL = `/api/scores/student/${userId}`;
    }
    const response = await axiosInstance.get(URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching scores:", error);
    throw error;
  }
}

///api/scores/parent/PA00001&studentId=SV2100001
export const getScoresByStudentID = async (studentID: string) => {
  try {
    const userId = await AsyncStorage.getItem("userId");
    if (!userId) {
      throw new Error("User ID not found in storage");
    }
    const response = await axiosInstance.get(`/api/scores/parent/${userId}&studentId=${studentID}`);
    return response.data;
  } catch (error) {
    console.error("Error fetching scores by student ID:", error);
    throw error;
  }
}