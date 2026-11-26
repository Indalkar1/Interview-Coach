import React, { useEffect, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import * as Speech from "expo-speech";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import api, { errorMessage } from "../api";
import s from "../styles";

export default function InterviewScreen({ route, navigation }) {
  const { sessionId, q } = route.params;
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recState = useAudioRecorderState(recorder);

  // Read the question aloud when the screen opens; stop speaking on leave
  useEffect(() => {
    Speech.speak(q.question, { language: "en-US" });
    return () => Speech.stop();
  }, [q.question]);

  useEffect(() => {
    if (recState.isRecording && recState.durationMillis >= 180000) {
      stopRecording();
    }
  }, [recState.durationMillis]);
  
  async function startRecording() {
    try {
      Speech.stop();
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return Alert.alert("Microphone permission is required");
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (e) {
      Alert.alert("Could not start recording", e.message);
    }
  }

  async function stopRecording() {
    try {
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false }); // restores normal speaker volume on iOS
      const uri = recorder.uri;
      if (!uri) return;

      setTranscribing(true);
      const form = new FormData();
      form.append("audio", { uri, name: "answer.m4a", type: "audio/m4a" });
      const { data } = await api.post("/sessions/transcribe", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Append, so the user can record in several chunks
      setAnswer((prev) => (prev ? prev.trimEnd() + " " : "") + data.text);
    } catch (e) {
      Alert.alert("Transcription failed", errorMessage(e));
    } finally {
      setTranscribing(false);
    }
  }

  async function submit() {
    if (!answer.trim()) return Alert.alert("Write or record an answer first");
    setLoading(true);
    try {
      const { data } = await api.post(`/sessions/${sessionId}/answer`, {
        answer,
      });
      navigation.replace("Feedback", { sessionId, ...data });
    } catch (e) {
      Alert.alert("Could not score answer", errorMessage(e));
      setLoading(false);
    }
  }

  const busy = loading || transcribing;

  return (
    <ScrollView style={s.screen} keyboardShouldPersistTaps="handled">
      <Text style={s.muted}>
        Question {q.questionNumber} of {q.totalQuestions} · {q.topic} ·{" "}
        {q.difficulty}
      </Text>
      <Text style={[s.question, { marginTop: 12 }]}>{q.question}</Text>

      <TouchableOpacity
        onPress={() => Speech.speak(q.question, { language: "en-US" })}
      >
        <Text style={s.link}>🔊 Read question again</Text>
      </TouchableOpacity>

      <TextInput
        style={[s.input, s.multiline, { marginTop: 16 }]}
        multiline
        placeholder="Type your answer, or tap the mic and speak..."
        value={answer}
        onChangeText={setAnswer}
        editable={!busy}
      />
      <Text style={[s.muted, { marginTop: 6 }]}>
        Check the text for transcription errors before submitting.
      </Text>

      <TouchableOpacity
        style={[
          s.button,
          { backgroundColor: recState.isRecording ? "#dc2626" : "#111827" },
        ]}
        onPress={recState.isRecording ? stopRecording : startRecording}
        disabled={busy}
      >
        {transcribing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.buttonText}>
            {recState.isRecording ? "⏹ Stop recording" : "🎤 Record answer"}
          </Text>
        )}
      </TouchableOpacity>
      {transcribing && (
        <Text style={[s.muted, { textAlign: "center", marginTop: 8 }]}>
          Transcribing…
        </Text>
      )}

      <TouchableOpacity
        style={s.button}
        onPress={submit}
        disabled={busy || recState.isRecording}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.buttonText}>Submit answer</Text>
        )}
      </TouchableOpacity>
      {loading && (
        <Text style={[s.muted, { textAlign: "center", marginTop: 12 }]}>
          Reviewing your answer…
        </Text>
      )}
    </ScrollView>
  );
}
