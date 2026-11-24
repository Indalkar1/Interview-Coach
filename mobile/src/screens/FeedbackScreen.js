import React from "react";
import { ScrollView, View, Text, TouchableOpacity } from "react-native";
import s from "../styles";

const Bar = ({ label, value }) => (
  <View style={{ marginTop: 8 }}>
    <Text>{label}: {value}/10</Text>
    <View style={{ height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, marginTop: 4 }}>
      <View style={{ height: 8, width: `${value * 10}%`, backgroundColor: "#2563eb", borderRadius: 4 }} />
    </View>
  </View>
);

export default function FeedbackScreen({ route, navigation }) {
  const { sessionId, evaluation: ev, done, nextQuestion } = route.params;

  function next() {
    if (done) navigation.replace("Summary", { sessionId });
    else navigation.replace("Interview", { sessionId, q: nextQuestion });
  }

  return (
    <ScrollView style={s.screen}>
      <Text style={s.bigScore}>{ev.score}/10</Text>
      <Bar label="Accuracy" value={ev.rubric.accuracy} />
      <Bar label="Depth" value={ev.rubric.depth} />
      <Bar label="Clarity" value={ev.rubric.clarity} />

      <Text style={s.label}>Strengths</Text>
      <View style={s.card}>{ev.strengths.map((t, i) => <Text key={i}>• {t}</Text>)}</View>

      <Text style={s.label}>To improve</Text>
      <View style={s.card}>{ev.improvements.map((t, i) => <Text key={i}>• {t}</Text>)}</View>

      <Text style={s.label}>Ideal answer</Text>
      <View style={s.card}><Text>{ev.idealAnswer}</Text></View>

      <TouchableOpacity style={s.button} onPress={next}>
        <Text style={s.buttonText}>{done ? "Finish" : "Next question"}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}