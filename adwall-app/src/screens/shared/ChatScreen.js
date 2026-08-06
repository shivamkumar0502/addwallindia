import React, { useState, useEffect, useRef } from "react";
import { View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import api from "../../api/api";
import { connectSocket, getSocket } from "../../api/socket";
import { useAuth } from "../../context/AuthContext";
import { colors, radius } from "../../theme/colors";

export default function ChatScreen({ route }) {
  const { bookingId } = route.params;
  const { user } = useAuth();
  const listRef = useRef(null);
  const typingTimeout = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const otherParticipant = conversation?.participants?.find((p) => p._id !== user?.id);

  useEffect(() => {
    (async () => {
      try {
        const { data: convData } = await api.get(`/chat/booking/${bookingId}`);
        setConversation(convData.data);
        const { data: msgData } = await api.get(`/chat/${convData.data._id}/messages`);
        setMessages(msgData.data);
      } catch (err) {
        console.error(err);
      } finally { setLoading(false); }
    })();
  }, [bookingId]);

  useEffect(() => {
    if (!conversation) return;
    let socket;
    (async () => {
      const token = await AsyncStorage.getItem("accessToken");
      socket = connectSocket(token);
      socket.emit("join:conversation", bookingId);
      socket.on("new:message", (msg) => setMessages((prev) => [...prev, msg]));
      socket.on("typing:start", ({ userId }) => { if (userId !== user?.id) setOtherTyping(true); });
      socket.on("typing:stop", ({ userId }) => { if (userId !== user?.id) setOtherTyping(false); });
    })();
    return () => {
      socket?.off("new:message");
      socket?.off("typing:start");
      socket?.off("typing:stop");
    };
  }, [conversation, bookingId]);

  useEffect(() => {
    if (messages.length) setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleTyping = (val) => {
    setText(val);
    const socket = getSocket();
    if (!socket) return;
    if (!typing) { setTyping(true); socket.emit("typing:start", { bookingId }); }
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => { setTyping(false); socket.emit("typing:stop", { bookingId }); }, 1500);
  };

  const handleSend = () => {
    if (!text.trim() || !conversation) return;
    const socket = getSocket();
    const tempMsg = { _id: Date.now().toString(), conversation: conversation._id, sender: { _id: user.id, name: user.name, avatar: user.avatar }, text, type: "text", createdAt: new Date().toISOString() };
    setMessages((prev) => [...prev, tempMsg]);
    socket?.emit("send:message", { conversationId: conversation._id, text });
    setText("");
    socket?.emit("typing:stop", { bookingId });
  };

  const handleImageSend = async () => {
    if (!conversation) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.6 });
    if (result.canceled) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("image", { uri: result.assets[0].uri, name: "chat.jpg", type: "image/jpeg" });
      const { data } = await api.post(`/chat/${conversation._id}/send`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessages((prev) => [...prev, data.data]);
    } catch (err) {
      console.error("Image send failed:", err);
    } finally { setSending(false); }
  };

  const isMyMessage = (msg) => (msg.sender?._id || msg.sender)?.toString() === user?.id;

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.brand500} /></View>;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: colors.gray50 }} keyboardVerticalOffset={90}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {otherParticipant?.avatar ? <Image source={{ uri: otherParticipant.avatar }} style={{ width: 36, height: 36, borderRadius: 18 }} /> : <Text style={styles.avatarText}>{otherParticipant?.name?.[0]?.toUpperCase()}</Text>}
        </View>
        <View>
          <Text style={styles.headerName}>{otherParticipant?.name}</Text>
          <Text style={styles.headerRole}>{otherTyping ? "typing..." : otherParticipant?.role}</Text>
        </View>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m._id?.toString()}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <View style={{ alignItems: "center", marginTop: 60 }}>
            <Text style={{ fontSize: 36 }}>💬</Text>
            <Text style={{ color: colors.gray400, fontSize: 13, marginTop: 8 }}>Conversation start karo!</Text>
          </View>
        }
        renderItem={({ item: msg }) => {
          const mine = isMyMessage(msg);
          return (
            <View style={[styles.msgRow, mine && { justifyContent: "flex-end" }]}>
              {msg.type === "image" ? (
                <Image source={{ uri: msg.imageUrl }} style={styles.msgImage} />
              ) : (
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.bubbleText, mine && { color: colors.white }]}>{msg.text}</Text>
                </View>
              )}
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TouchableOpacity onPress={handleImageSend} disabled={sending} style={{ padding: 6 }}>
          <Ionicons name="image-outline" size={22} color={colors.gray400} />
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          placeholder="Message likho..."
          value={text}
          onChangeText={handleTyping}
          onSubmitEditing={handleSend}
        />
        <TouchableOpacity onPress={handleSend} disabled={!text.trim()} style={[styles.sendBtn, !text.trim() && { opacity: 0.4 }]}>
          <Ionicons name="send" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  header: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.white, padding: 14, borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gray200, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700", color: colors.gray600 },
  headerName: { fontSize: 13.5, fontWeight: "700", color: colors.gray900 },
  headerRole: { fontSize: 11, color: colors.gray400, textTransform: "capitalize" },
  msgRow: { flexDirection: "row" },
  bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 9, borderRadius: 16 },
  bubbleMine: { backgroundColor: colors.brand500, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.gray100, borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 13.5, color: colors.gray900, lineHeight: 19 },
  msgImage: { width: 180, height: 180, borderRadius: 14 },
  inputBar: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.gray100, padding: 10 },
  textInput: { flex: 1, backgroundColor: colors.gray50, borderRadius: radius.full, paddingHorizontal: 14, height: 40, fontSize: 13.5 },
  sendBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.brand500, alignItems: "center", justifyContent: "center" },
});
