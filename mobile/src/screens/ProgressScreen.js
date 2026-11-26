import React, { useCallback, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import api, { errorMessage } from "../api";
import s from "../styles";

const CHART_HEIGHT = 140;

function TrendChart({ trend }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-end", height: CHART_HEIGHT + 24, marginTop: 8 }}>
      {trend.map((t, i) => (
        <View key={i} style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}>
          <Text style={{ fontSize: 10 }}>{t.score}</Text>
          <View
            style={{
              width: "60%",
              height: Math.max(4, (t.score / 10) * CHART_HEIGHT),
              backgroundColor: t.score >= 7 ? "#16a34a" : t.score >= 5 ? "#2563eb" : "#dc2626",
              borderRadius: 4,
              marginTop: 2,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export default function ProgressScreen({ navigation }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const res = await api.get("/progress");
          setData(res.data);
        } catch (e) {
          Alert.alert("Error", errorMessage(e));
        } finally {
          setLoading(false);
        }
      })();
    }, [])
  );

  async function practiceWeakSpots() {
    setStarting(true);
    try {
      const { data: q } = await api.post("/sessions", {
        role: data.last.role,
        level: data.last.level,
        focusWeak: true,
      });
      navigation.navigate("Interview", { sessionId: q.sessionId, q });
    } catch (e) {
      Alert.alert("Could not start", errorMessage(e));
    } finally {
      setStarting(false);
    }
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;
  if (!data || data.totalSessions === 0) {
    return (
      <View style={[s.screen, { justifyContent: "center" }]}>
        <Text style={[s.title, { textAlign: "center" }]}>No progress yet</Text>
        <Text style={[s.muted, { textAlign: "center" }]}>
          Finish your first interview and your score trend will show up here.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={s.screen}>
      <View style={[s.row, { marginTop: 4 }]}>
        {[
          ["Sessions", data.totalSessions],
          ["Average", data.average],
          ["Best", data.best],
        ].map(([label, value]) => (
          <View key={label} style={[s.card, { flex: 1, alignItems: "center", marginTop: 0 }]}>
            <Text style={{ fontSize: 22, fontWeight: "800" }}>{value}</Text>
            <Text style={s.muted}>{label}</Text>
          </View>
        ))}
      </View>

      <Text style={s.label}>Score trend (last {data.trend.length})</Text>
      <View style={s.card}>
        <TrendChart trend={data.trend} />
        <Text style={[s.muted, { fontSize: 12, marginTop: 6 }]}>Oldest on the left, newest on the right</Text>
      </View>

      <Text style={s.label}>Weak topics</Text>
      {data.weakTopics.length === 0 ? (
        <View style={s.card}>
          <Text style={s.muted}>
            Nothing flagged yet. A topic appears here after you answer at least 2 questions on it and average below 7.
          </Text>
        </View>
      ) : (
        data.weakTopics.map((t) => (
          <View key={t.topic} style={[s.card, { flexDirection: "row", justifyContent: "space-between" }]}>
            <Text style={{ fontWeight: "600", flex: 1 }}>{t.topic}</Text>
            <Text style={s.muted}>{t.avgScore}/10 · {t.attempts} answers</Text>
          </View>
        ))
      )}

      {data.weakTopics.length > 0 && (
        <TouchableOpacity style={s.button} onPress={practiceWeakSpots} disabled={starting}>
          {starting ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Practice my weak spots</Text>}
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}