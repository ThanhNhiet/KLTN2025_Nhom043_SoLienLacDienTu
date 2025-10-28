import React, { useState } from 'react';
import { View, Image, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons'; 

const FullImageScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const { uri } = route.params as { uri: string };

    return (
      <View style={styles.container}>
        {/* Nút back */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
  
        {/* Ảnh full */}
        <Image source={{ uri }} style={styles.image} resizeMode="contain" />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
    },
    image: {
      flex: 1,
      width: '100%',
      height: '100%',
    },
    backButton: {
      position: 'absolute',
      top: 40, // có thể điều chỉnh tùy theo status bar
      left: 20,
      zIndex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
      padding: 6,
    },
  });

export default FullImageScreen;
