import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: { flex: 1, padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12, fontSize: 16 },
  multiline: { minHeight: 160, textAlignVertical: "top" },
  button: { backgroundColor: "#2563eb", padding: 14, borderRadius: 8, alignItems: "center", marginTop: 20 },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  link: { color: "#2563eb", textAlign: "center", marginTop: 16 },
  row: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: "#ccc", alignItems: "center" },
  chipActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  chipText: { fontWeight: "600" },
  chipTextActive: { color: "#fff" },
  card: { backgroundColor: "#f3f4f6", borderRadius: 10, padding: 14, marginTop: 12 },
  bigScore: { fontSize: 48, fontWeight: "800", textAlign: "center" },
  muted: { color: "#6b7280" },
  question: { fontSize: 20, fontWeight: "600", lineHeight: 28 },
});