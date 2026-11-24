import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import api from "../api";
import s from "../styles";

export default function SummaryScreen({ route, navigation }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.post(`/sessions/${route.params.sessionId}/finish`).then((r) => setData(r.data));
  }, []);

  if (!data) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <View style={s.screen}>
      <Text style={s.title}>Session complete</Text>
      <Text style={s.bigScore}>{data.overallScore}/10</Text>
      <Text style={[s.muted, { textAlign: "center" }]}>{data.answered} questions answered</Text>

      <Text style={s.label}>Weakest answers</Text>
      {data.weakestAnswers.map((w, i) => (
        <View key={i} style={s.card}>
          <Text style={{ fontWeight: "700" }}>{w.topic} ({w.score}/10)</Text>
          <Text>{w.question}</Text>
        </View>
      ))}

      <TouchableOpacity style={s.button} onPress={() => navigation.popToTop()}>
        <Text style={s.buttonText}>Back to home</Text>
      </TouchableOpacity>
    </View>
  );
}