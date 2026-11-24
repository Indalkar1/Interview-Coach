import React, { useCallback, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import api, { API_URL, errorMessage } from "../api";
import s from "../styles";

export default function ProfileScreen() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get("/resume");
      setResume(data);
    } catch (e) {
      Alert.alert("Error", errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function pickAndUpload() {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const file = result.assets[0];
    setUploading(true);
    try {
      const token = await SecureStore.getItemAsync("token");
      const form = new FormData();
      form.append("resume", { uri: file.uri, name: file.name || "resume.pdf", type: "application/pdf" });

      const res = await fetch(`${API_URL}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type: fetch sets the boundary
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await load();
      Alert.alert("Resume added", "Your interview questions can now be tailored to it.");
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  }

  function confirmDelete() {
    Alert.alert("Delete resume?", "This removes your resume summary from the app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await api.delete("/resume");
            await load();
          } catch (e) {
            Alert.alert("Error", errorMessage(e));
          }
        },
      },
    ]);
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <ScrollView style={s.screen}>
      <Text style={s.title}>Your resume</Text>

      {resume?.hasResume ? (
        <>
          <Text style={s.label}>Summary</Text>
          <View style={s.card}><Text>{resume.summary}</Text></View>
          <Text style={s.label}>Skills</Text>
          <View style={s.card}><Text>{resume.skills.join(", ")}</Text></View>
        </>
      ) : (
        <Text style={s.muted}>
          No resume uploaded yet. Upload a PDF and your questions will focus on your own projects and skills.
        </Text>
      )}

      <TouchableOpacity style={s.button} onPress={pickAndUpload} disabled={uploading}>
        {uploading ? <ActivityIndicator color="#fff" /> :
          <Text style={s.buttonText}>{resume?.hasResume ? "Replace resume (PDF)" : "Upload resume (PDF)"}</Text>}
      </TouchableOpacity>
      {uploading && <Text style={[s.muted, { textAlign: "center", marginTop: 8 }]}>Reading your resume…</Text>}

      {resume?.hasResume && (
        <Text style={[s.link, { color: "#dc2626" }]} onPress={confirmDelete}>Delete my resume</Text>
      )}
      <Text style={[s.muted, { marginTop: 24 }]}>
        Your resume text is sent to an AI provider to extract a summary. Only the summary is stored.
      </Text>
    </ScrollView>
  );
}