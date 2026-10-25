import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, TextInput,
  ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import api from "../api/api";
import { colors, radius } from "../theme/colors";

/* Addy — AI chatbot. Web pe pehle se tha, app me nahi tha.
   Floating button har screen pe dikhta hai (App.js me ek baar mount karo). */

const WELCOME = {
  id: "welcome",
  role: "bot",
  text: "Namaste! Main Addy hoon — AdWall India ka assistant.\n\nHoarding search, booking, KYC — kuch bhi pucho!",
};

const FALLBACK_SUGGESTIONS = [
  "Hoarding book kaise karun?",
  "Apni hoarding list karni hai",
  "Escrow payment kya hai?",
  "KYC me kya documents lagenge?",
];

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(FALLBACK_SUGGESTIONS);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    api
      .get("/chatbot/suggestions")
      .then(({ data }) => {
        const s = data.data?.suggestions;
        if (Array.isArray(s) && s.length) setSuggestions(s);
      })
      .catch(() => {}); // fallback pehle se set hai
  }, [open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;

    const userMsg = { id: `u${Date.now()}`, role: "user", text: msg };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = messages
        .filter((m) => m.id !== "welcome")
        .slice(-8)
        .map((m) => ({ role: m.role === "user" ? "user" : "model", text: m.text }));

      const { data } = await api.post("/chatbot/message", { message: msg, history });
      setMessages((m) => [
        ...m,
        { id: `b${Date.now()}`, role: "bot", text: data.data?.reply || "Samajh nahi aaya, dobara pucho." },
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: `e${Date.now()}`,
          role: "bot",
          text: !err.response
            ? "Server se connect nahi ho paya. Internet check karo."
            : "Abhi jawab nahi de pa raha. Thodi der baad try karo.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const reset = () => {
    setMessages([WELCOME]);
    setInput("");
  };

  return (
    <>
      {/* Floating button */}
      <TouchableOpacity style={styles.fab} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Ionicons name="chatbubble-ellipses" size={24} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <View style={styles.backdrop}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={styles.sheet}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.avatar}>
                  <Ionicons name="sparkles" size={15} color={colors.white} />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Addy</Text>
                  <Text style={styles.headerSub}>AdWall India Assistant</Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <TouchableOpacity onPress={reset} style={{ padding: 6 }}>
                  <Ionicons name="refresh" size={18} color={colors.gray500} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setOpen(false)} style={{ padding: 6 }}>
                  <Ionicons name="close" size={20} color={colors.gray500} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messages}
              contentContainerStyle={{ padding: 14, gap: 10 }}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[styles.bubble, m.role === "user" ? styles.bubbleUser : styles.bubbleBot]}
                >
                  <Text style={m.role === "user" ? styles.textUser : styles.textBot}>
                    {m.text.replace(/\*\*/g, "")}
                  </Text>
                </View>
              ))}

              {loading && (
                <View style={[styles.bubble, styles.bubbleBot, { flexDirection: "row", gap: 8 }]}>
                  <ActivityIndicator size="small" color={colors.brand500} />
                  <Text style={styles.textBot}>Soch raha hoon...</Text>
                </View>
              )}
            </ScrollView>

            {/* Suggestions — sirf shuru me */}
            {messages.length === 1 && (
              <View style={styles.suggestions}>
                {suggestions.slice(0, 4).map((s) => (
                  <TouchableOpacity key={s} style={styles.chip} onPress={() => send(s)}>
                    <Text style={styles.chipText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Input */}
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Message likho..."
                placeholderTextColor={colors.gray400}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={() => send()}
                returnKeyType="send"
                editable={!loading}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || loading) && { opacity: 0.4 }]}
                onPress={() => send()}
                disabled={!input.trim() || loading}
              >
                <Ionicons name="send" size={17} color={colors.white} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 18,
    bottom: 90, // tab bar ke upar
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.brand500,
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    zIndex: 999,
  },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  sheet: {
    height: "82%",
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.brand500,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  headerSub: { fontSize: 11, color: colors.gray500 },

  messages: { flex: 1, backgroundColor: colors.gray50 },
  bubble: { maxWidth: "82%", paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14 },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: colors.brand500, borderBottomRightRadius: 4 },
  bubbleBot: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray100,
    borderBottomLeftRadius: 4,
  },
  textUser: { color: colors.white, fontSize: 14, lineHeight: 20 },
  textBot: { color: colors.gray800, fontSize: 14, lineHeight: 20 },

  suggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: colors.gray50,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.gray200,
    backgroundColor: colors.white,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontSize: 12, color: colors.gray700 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  input: {
    flex: 1,
    height: 44,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderRadius: 22,
    fontSize: 14,
    color: colors.gray900,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.brand500,
    alignItems: "center",
    justifyContent: "center",
  },
});