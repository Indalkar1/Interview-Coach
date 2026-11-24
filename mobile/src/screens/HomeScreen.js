import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import api, { errorMessage } from "../api";
import { useAuth } from "../AuthContext";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import s from "../styles";

const LEVELS = ["junior", "mid", "senior"];

export default function HomeScreen({ navigation }) {
  const { logout } = useAuth();
  const [role, setRole] = useState("React Native developer");
  const [level, setLevel] = useState("mid");
  const [loading, setLoading] = useState(false);
  const [useResume, setUseResume] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const { data } = await api.post("/sessions", {
        role: role.trim(),
        level,
        useResume,
      });
      navigation.navigate("Interview", { sessionId: data.sessionId, q: data });
    } catch (e) {
      Alert.alert("Could not start", errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={s.screen}>
      <Text style={s.title}>Mock Interview</Text>
      <Text style={s.label}>Role</Text>
      <TextInput style={s.input} value={role} onChangeText={setRole} />
      <Text style={s.label}>Level</Text>
      <View style={s.row}>
        {LEVELS.map((l) => (
          <TouchableOpacity
            key={l}
            style={[s.chip, level === l && s.chipActive]}
            onPress={() => setLevel(l)}
          >
            <Text style={[s.chipText, level === l && s.chipTextActive]}>
              {l}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View
        style={[
          s.row,
          {
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 20,
          },
        ]}
      >
        <Text style={{ fontSize: 16 }}>Tailor questions to my resume</Text>
        <Switch value={useResume} onValueChange={setUseResume} />
      </View>
      <TouchableOpacity style={s.button} onPress={start} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={s.buttonText}>Start interview</Text>
        )}
      </TouchableOpacity>
      <Text style={s.link} onPress={() => navigation.navigate("Profile")}>
        My resume
      </Text>
      <Text style={s.link} onPress={logout}>
        Log out
      </Text>
    </View>
  );
}
