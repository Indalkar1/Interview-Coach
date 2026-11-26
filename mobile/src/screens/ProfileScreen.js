import React, { useCallback, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  View,
  Text,
  TextInput,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as DocumentPicker from "expo-document-picker";
import * as SecureStore from "expo-secure-store";
import api, { API_URL, errorMessage } from "../api";
import s from "../styles";
import { useAuth } from "../AuthContext";

export default function ProfileScreen() {
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const { logout } = useAuth();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function deleteAccount() {
    setDeleting(true);
    try {
      await api.delete("/auth/me", { data: { password } });
      await logout(); // clears the token and returns to the login screen
    } catch (e) {
      Alert.alert("Could not delete account", errorMessage(e));
      setDeleting(false);
    }
  }

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

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
      form.append("resume", {
        uri: file.uri,
        name: file.name || "resume.pdf",
        type: "application/pdf",
      });

      const res = await fetch(`${API_URL}/resume`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // no Content-Type: fetch sets the boundary
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      await load();
      Alert.alert(
        "Resume added",
        "Your interview questions can now be tailored to it.",
      );
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  }

  function confirmDelete() {
    Alert.alert(
      "Delete resume?",
      "This removes your resume summary from the app.",
      [
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
      ],
    );
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <ScrollView style={s.screen}>
      <Text style={s.title}>Your resume</Text>

      {resume?.hasResume ? (
        <>
          <Text style={s.label}>Summary</Text>
          <View style={s.card}>
            <Text>{resume.summary}</Text>
          </View>
          <Text style={s.label}>Skills</Text>
          <View style={s.card}>
            <Text>{resume.skills.join(", ")}</Text>
          </View>
        </>
      ) : (
        <Text style={s.muted}>
          No resume uploaded yet. Upload a PDF and your questions will focus on
          your own projects and skills.
        </Text>
      )}

      <TouchableOpacity
        style={s.button}
        onPress={pickAndUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.buttonText}>
            {resume?.hasResume ? "Replace resume (PDF)" : "Upload resume (PDF)"}
          </Text>
        )}
      </TouchableOpacity>
      {uploading && (
        <Text style={[s.muted, { textAlign: "center", marginTop: 8 }]}>
          Reading your resume…
        </Text>
      )}

      {resume?.hasResume && (
        <Text style={[s.link, { color: "#dc2626" }]} onPress={confirmDelete}>
          Delete my resume
        </Text>
      )}
      <Text style={[s.muted, { marginTop: 24 }]}>
        Your resume text is sent to an AI provider to extract a summary. Only
        the summary is stored.
      </Text>
      <View style={{ marginTop: 32, marginBottom: 40 }}>
        {!showDelete ? (
          <Text
            style={[s.link, { color: "#dc2626" }]}
            onPress={() => setShowDelete(true)}
          >
            Delete my account
          </Text>
        ) : (
          <View style={s.card}>
            <Text style={{ fontWeight: "700" }}>
              This permanently deletes your account, sessions and resume.
            </Text>
            <TextInput
              style={[s.input, { marginTop: 12, backgroundColor: "#fff" }]}
              placeholder="Enter your password to confirm"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={[s.button, { backgroundColor: "#dc2626" }]}
              onPress={deleteAccount}
              disabled={deleting || !password}
            >
              {deleting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.buttonText}>Permanently delete</Text>
              )}
            </TouchableOpacity>
            <Text
              style={s.link}
              onPress={() => {
                setShowDelete(false);
                setPassword("");
              }}
            >
              Cancel
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
