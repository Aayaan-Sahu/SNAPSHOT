import React, { useState, useEffect, useRef } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, Linking } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getUploadUrl, confirmUpload, UploadConfig } from "./api"
import { compressImage, uploadToS3 } from "../../services/media";
import { useSnapshot } from "../../context/SnapshotContext";

export const CameraScreen = () => {
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const { markAsPosted } = useSnapshot();

  // State Machine
  const [config, setConfig] = useState<UploadConfig | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null); // If set, we are in "Review Mode"
  const [status, setStatus] = useState<"initializing" | "ready" | "uploading">("initializing");

  useEffect(() => {
    async function init() {
      // 1. Wait for permission hook to load
      if (!permission) return;

      // 2. If Permission is GRANTED, try to set up the session
      if (permission.granted) {
        try {
          // Attempt to get the S3 ticket
          const uploadConfig = await getUploadUrl();
          setConfig(uploadConfig);
          setStatus("ready"); // <--- This removes the loading screen
        } catch (err: any) {
          console.error("Camera Init Error:", err);
          
          // Determine the error message (Backend usually sends 403 for window closed)
          const isWindowClosed = err.response?.status === 403;
          const msg = isWindowClosed 
            ? "The 10-minute snapshot window is currently closed." 
            : "Could not setup the camera session. Please try again.";

          // Alert and Go Back
          Alert.alert("Snapshot Unavailable", msg, [
            { text: "OK", onPress: () => navigation.goBack() }
          ]);
        }
        return;
      }

      // 3. If Permission is NOT GRANTED, ask for it
      if (permission.canAskAgain) {
        console.log("Requesting permission...");
        const response = await requestPermission();
        
        // If they deny it now, kick them out
        if (!response.granted) {
          Alert.alert("Permission Required", "We need camera access to take snapshots.");
          navigation.goBack();
        }
        // If they grant it, this useEffect will re-run automatically because [permission] changes
      } else {
        // 4. Hard Denied (Settings needed)
        Alert.alert(
          "Camera Access Denied", 
          "Please enable Camera access in your Phone Settings to use this feature.",
          [
            { text: "Cancel", style: "cancel", onPress: () => navigation.goBack() },
            { text: "Open Settings", onPress: () => Linking.openSettings() }
          ]
        );
      }
    }

    init();
  }, [permission]);

  // 2. Take Photo
  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: true, // Speed up the shutter
      });
      if (photo?.uri) {
          setPhotoUri(photo.uri); // Switch UI to "Review Mode"
      }
    } catch (e) {
      console.log(e);
    }
  };

  // 3. The Core Loop: Compress -> Upload -> Confirm
  const handleSend = async () => {
    if (!photoUri || !config?.key) return;

    setStatus("uploading");
    try {
      // Step A: Compress
      const compressedUri = await compressImage(photoUri);
      
      // Step B: Upload to S3
      console.log("trying to upload to:", config.upload_url);
      await uploadToS3(config.upload_url, compressedUri);
      
      // Step C: Confirm to Backend
      await confirmUpload(config.key, config.slot_timestamp);
      
      // Step D: Optimistic Update (TODO: Tell Feed we posted)
      markAsPosted();
      
      // Step E: Done
      Alert.alert("Success", "Snapshot posted!", [
        { text: "Great", onPress: () => navigation.goBack() }
      ]);
      
    } catch (e: any) {
      console.error(e);
      Alert.alert("Upload Failed", "Could not upload photo. Please try again.");
      setStatus("ready"); // Allow retrying
    }
  };

  // RENDER: Loading State
  if (!permission?.granted || status === "initializing") {
    return (
      <View style={styles.blackBg}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.text}>Preparing camera...</Text>
      </View>
    );
  }

  // RENDER: Review Mode (Photo Taken)
  if (photoUri) {
    return (
      <View style={styles.blackBg}>
        <Image source={{ uri: photoUri }} style={styles.previewImage} />
        
        {status === "uploading" ? (
           <View style={styles.overlay}>
             <ActivityIndicator size="large" color="#fff" />
             <Text style={styles.text}>Posting...</Text>
           </View>
        ) : (
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setPhotoUri(null)} style={styles.btnSecondary}>
              <Text style={styles.btnText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSend} style={styles.btnPrimary}>
              <Text style={styles.btnText}>SEND 🚀</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  }

  // RENDER: Capture Mode (Live Camera)
  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef} facing="back">
        <SafeAreaView style={styles.uiContainer}>
            <View style={styles.spacer} />
            {/* Shutter Button */}
            <TouchableOpacity onPress={takePicture} style={styles.shutterBtn}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
        </SafeAreaView>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black" },
  blackBg: { flex: 1, backgroundColor: "black", justifyContent: "center", alignItems: "center" },
  camera: { flex: 1 },
  uiContainer: { flex: 1, justifyContent: "space-between" },
  spacer: { flex: 1 },
  text: { color: "white", marginTop: 20 },
  previewImage: { width: "100%", height: "100%", resizeMode: "cover" },
  
  // Controls
  controls: { position: "absolute", bottom: 50, flexDirection: "row", width: "100%", justifyContent: "space-around" },
  btnPrimary: { backgroundColor: "white", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  btnSecondary: { backgroundColor: "#333", paddingVertical: 15, paddingHorizontal: 40, borderRadius: 30 },
  btnText: { fontWeight: "bold", fontSize: 16 },
  
  // Shutter
  shutterBtn: { 
      alignSelf: "center", marginBottom: 40, width: 80, height: 80, 
      borderRadius: 40, borderWidth: 5, borderColor: "white", 
      justifyContent: "center", alignItems: "center" 
  },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: "white" },
  
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center'}
});