import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

//import page home
import HomeScreen from "@/src/screens/home/HomeScreen";

//import page login
import LoginScreen from "@/src/screens/login/LoginScreen";

//import page forgot password
import ForgotPasswordScreen from "@/src/screens/forgotpassword/ForgotPasswordScreen";

//import page change password
import ChangePasswordScreen from "@/src/screens/changepassword/ChangePasswordScreen";

//import page otp verify
import OtpVerifyScreen from "@/src/screens/otpverify/OtpVerifyScreen";

//import page attendance
import AttendanceScreen from "@/src/screens/attendance/AttendanceScreen";
import AttendanceDetailScreen from "@/src/screens/attendance/AttendanceDetailScreen";
import AttendanceScreen_Parent from "@/src/screens/attendance/AttendanceScreen_Parent";

//import page calendar
import CalendarScreen from "@/src/screens/calendar/CalendarScreen";
import CalendarScreen_Parent from "@/src/screens/calendar/CalendarScreen_Parent";

//import page profile
import ProfileScreen from "@/src/screens/profile/ProfileSceen";
import ProfileDetailScreen from "@/src/screens/profile/ProfileDetailScreen";
import ProfileChangePasswordScreen from "@/src/screens/profile/ProfileChangePasswordScreen";

//import page chat
import ChatScreen from "@/src/screens/chat/ChatScreen";
import MessageScreen from "@/src/screens/chat/MessageScreen";
import MessageDetailScreen from "@/src/screens/chat/MessageDetailScreen";
import FullImageScreen from "../screens/chat/FullImageScreen";

// import score 
import ScoreScreen from "../screens/score/ScoreScreen";
import ScoreScreen_Parent from "../screens/score/ScoreScreen_Parent";

const Stack = createNativeStackNavigator();

export default function AppRouter() {
    return (
        <Stack.Navigator initialRouteName="LoginScreen">
            {/*Login Screen*/}
            <Stack.Screen
                name="LoginScreen"
                component={LoginScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Home Screen*/}
            <Stack.Screen
                name="HomeScreen"
                component={HomeScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Forgot Password Screen*/}
            <Stack.Screen
                name="ForgotPasswordScreen"
                component={ForgotPasswordScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Change Password Screen*/}
            <Stack.Screen
                name="ChangePasswordScreen"
                component={ChangePasswordScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Otp Verify Screen*/}
            <Stack.Screen
                name="OtpVerifyScreen"
                component={OtpVerifyScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Attendance Screen*/}
            <Stack.Screen
                name="AttendanceScreen"
                component={AttendanceScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="AttendanceDetailScreen"
                component={AttendanceDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="AttendanceScreen_Parent"
                component={AttendanceScreen_Parent}
                options={{
                    headerShown: false,
                }}
            />

            {/*Calendar Screen*/}
            <Stack.Screen
                name="CalendarScreen"
                component={CalendarScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="CalendarScreen_Parent"
                component={CalendarScreen_Parent}
                options={{
                    headerShown: false,
                }}
            />
            {/*Profile Screen*/}
            <Stack.Screen
                name="ProfileScreen"
                component={ProfileScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ProfileDetailScreen"
                component={ProfileDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ProfileChangePasswordScreen"
                component={ProfileChangePasswordScreen}
                options={{
                    headerShown: false,
                }}
            />
            {/*Chat Screen*/}
            <Stack.Screen
                name="ChatScreen"
                component={ChatScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MessageScreen"
                component={MessageScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="MessageDetailScreen"
                component={MessageDetailScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="FullImageScreen"
                component={FullImageScreen}
                options={{
                    headerShown: false,
                }}
            />

            {/* Score Screen */}
            <Stack.Screen
                name="ScoreScreen"
                component={ScoreScreen}
                options={{
                    headerShown: false,
                }}
            />
            <Stack.Screen
                name="ScoreScreen_Parent"
                component={ScoreScreen_Parent}
                options={{
                    headerShown: false,
                }}
            />

        </Stack.Navigator>
    );
}