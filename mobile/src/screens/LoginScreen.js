import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../AuthContext";
import { errorMessage } from "../api";
import s from "../styles";

export default function LoginScreen() {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await (isRegister ? register : login)(email.trim(), password);
    } catch (e) {
      Alert.alert("Error", errorMessage(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.screen, { justifyContent: "center" }]}>
      <Text style={s.title}>{isRegister ? "Create account" : "Welcome back"}</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={[s.input, { marginTop: 12 }]} placeholder="Password (min 8 characters)"
        secureTextEntry value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.button} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> :
          <Text style={s.buttonText}>{isRegister ? "Register" : "Log in"}</Text>}
      </TouchableOpacity>
      <Text style={s.link} onPress={() => setIsRegister(!isRegister)}>
        {isRegister ? "Already have an account? Log in" : "New here? Create an account"}
      </Text>
    </View>
  );
}