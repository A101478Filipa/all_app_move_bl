import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { HStack } from '@components/CoreComponents';
import { Color } from '@src/styles/colors';
import { FontFamily, FontSize } from '@src/styles/fonts';
import { Spacing } from '@src/styles/spacings';
import { Border } from '@src/styles/borders';
import { shadowStyles } from '@src/styles/shadow';
import { useTranslation } from '@src/localization/hooks/useTranslation';
import { chatbotApi, ChatbotAction, ChatbotSuggestion } from '@src/api/endpoints/chatbot';
import { ChatMessage, useChatbotStore } from '@src/stores/chatbotStore';
import { runHelpAction } from './helpActions';

interface Props {
  /** When true, the panel re-fetches the role-aware welcome + suggestions. */
  active: boolean;
}

/**
 * Reusable chat UI for the help assistant. Used inside the floating
 * chat modal so it can be opened from anywhere in the app.
 */
const HelpChatPanel: React.FC<Props> = ({ active }) => {
  const { t, currentLanguage } = useTranslation();
  const lang = currentLanguage?.startsWith('en') ? 'en' : 'pt';

  const messages = useChatbotStore(s => s.messages);
  const setMessages = useChatbotStore(s => s.setMessages);
  const addMessage = useChatbotStore(s => s.addMessage);
  const closeChat = useChatbotStore(s => s.close);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [suggestions, setSuggestions] = useState<ChatbotSuggestion[]>([]);
  const [initialized, setInitialized] = useState(messages.length > 0);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const fallbackWelcome = useMemo(() => t('helpChat.welcome'), [t]);

  useEffect(() => {
    if (!active) return;
    if (messages.length > 0) {
      // Conversation persisted across open/close — keep it, just ensure suggestions.
      setInitialized(true);
      if (suggestions.length === 0) {
        chatbotApi.init(lang)
          .then(res => setSuggestions(res.data?.suggestions ?? []))
          .catch(() => undefined);
      }
      return;
    }

    let cancelled = false;
    chatbotApi.init(lang)
      .then(res => {
        if (cancelled) return;
        const welcomeText = res.data?.welcome ?? fallbackWelcome;
        setMessages([{ id: 'welcome', sender: 'bot', text: welcomeText }]);
        setSuggestions(res.data?.suggestions ?? []);
        setInitialized(true);
      })
      .catch(() => {
        if (cancelled) return;
        setMessages([{ id: 'welcome', sender: 'bot', text: fallbackWelcome }]);
        setInitialized(true);
      });

    return () => { cancelled = true; };
  }, [active, lang, fallbackWelcome, messages.length, setMessages, suggestions.length]);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const sendQuestion = useCallback(async (question: string, entryId?: string) => {
    const trimmed = question.trim();
    if (!trimmed || sending) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', text: trimmed };
    addMessage(userMsg);
    setInput('');
    setSending(true);
    scrollToEnd();

    try {
      const res = await chatbotApi.ask({ question: trimmed, lang, entryId });
      const data = res.data;
      const botMsg: ChatMessage = {
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: data?.answer ?? t('helpChat.errorGeneric'),
        action: data?.action ?? null,
      };
      addMessage(botMsg);
      if (data && !data.matched && data.suggestions?.length) {
        setSuggestions(data.suggestions);
      }
    } catch {
      addMessage({
        id: `b-${Date.now()}`,
        sender: 'bot',
        text: t('helpChat.errorGeneric'),
      });
    } finally {
      setSending(false);
      scrollToEnd();
    }
  }, [sending, lang, t, scrollToEnd, addMessage]);

  const onActionPress = useCallback((action: ChatbotAction) => {
    const ok = runHelpAction(action.id);
    if (ok) closeChat();
  }, [closeChat]);

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.bubbleRow, isUser ? styles.bubbleRowUser : styles.bubbleRowBot]}>
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleBot]}>
          <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextBot]}>
            {item.text}
          </Text>
          {!isUser && item.action ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => onActionPress(item.action!)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="open-in-new" size={16} color={Color.white} />
              <Text style={styles.actionButtonText} numberOfLines={1}>
                {item.action.label}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.disclaimer}>
        <MaterialIcons name="lock" size={16} color={Color.Gray.v500} />
        <Text style={styles.disclaimerText}>{t('helpChat.privacyNote')}</Text>
      </View>

      {!initialized ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Color.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={scrollToEnd}
        />
      )}

      {suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>{t('helpChat.suggestionsTitle')}</Text>
          <View style={styles.suggestionsList}>
            {suggestions.slice(0, 6).map(s => (
              <TouchableOpacity
                key={s.id}
                style={styles.suggestionChip}
                onPress={() => sendQuestion(s.question, s.id)}
                disabled={sending}
              >
                <Text style={styles.suggestionChipText} numberOfLines={2}>{s.question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <HStack style={styles.inputBar} spacing={Spacing.sm_8} align="center">
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder={t('helpChat.inputPlaceholder')}
          placeholderTextColor={Color.Gray.v400}
          editable={!sending}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendQuestion(input)}
          blurOnSubmit
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]}
          onPress={() => sendQuestion(input)}
          disabled={!input.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color={Color.white} />
            : <MaterialIcons name="send" size={20} color={Color.white} />}
        </TouchableOpacity>
      </HStack>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Color.Background.subtle },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  disclaimer: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.xs_6,
    paddingHorizontal: Spacing.md_16, paddingVertical: Spacing.sm_8,
    backgroundColor: Color.Gray.v100,
  },
  disclaimerText: { flex: 1, color: Color.Gray.v500, fontSize: FontSize.caption_12, fontFamily: FontFamily.medium },

  listContent: { padding: Spacing.md_16, paddingBottom: Spacing.lg_24 },

  bubbleRow: { flexDirection: 'row', marginBottom: Spacing.sm_8 },
  bubbleRowUser: { justifyContent: 'flex-end' },
  bubbleRowBot: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    borderRadius: Border.lg_16,
    ...shadowStyles.cardShadow,
  },
  bubbleUser: { backgroundColor: Color.primary, borderBottomRightRadius: Border.xs_4 },
  bubbleBot: { backgroundColor: Color.white, borderBottomLeftRadius: Border.xs_4 },
  bubbleText: { fontSize: FontSize.bodymedium_16, fontFamily: FontFamily.regular, lineHeight: 22 },
  bubbleTextUser: { color: Color.white },
  bubbleTextBot: { color: Color.Gray.v500 },

  actionButton: {
    marginTop: Spacing.sm_8,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs_6,
    backgroundColor: Color.primary,
    paddingHorizontal: Spacing.md_12,
    paddingVertical: Spacing.xs_6,
    borderRadius: Border.full,
    maxWidth: '100%',
  },
  actionButtonText: {
    color: Color.white,
    fontSize: FontSize.bodysmall_14,
    fontFamily: FontFamily.medium,
  },

  suggestionsContainer: {
    paddingHorizontal: Spacing.md_16,
    paddingTop: Spacing.sm_8,
    paddingBottom: Spacing.xs_4,
    backgroundColor: Color.Background.subtle,
  },
  suggestionsTitle: {
    fontSize: FontSize.caption_12,
    fontFamily: FontFamily.medium,
    color: Color.Gray.v500,
    marginBottom: Spacing.xs_4,
  },
  suggestionsList: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs_6 },
  suggestionChip: {
    backgroundColor: Color.white,
    borderColor: Color.primary,
    borderWidth: 1,
    borderRadius: Border.full,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.xs_6,
    maxWidth: '100%',
  },
  suggestionChipText: { color: Color.primary, fontSize: FontSize.bodysmall_14, fontFamily: FontFamily.medium },

  inputBar: {
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    backgroundColor: Color.white,
    borderTopWidth: 1,
    borderTopColor: Color.Gray.v100,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: Spacing.md_16,
    paddingVertical: Spacing.sm_8,
    backgroundColor: Color.Background.subtle,
    borderRadius: Border.lg_16,
    fontSize: FontSize.bodymedium_16,
    fontFamily: FontFamily.regular,
    color: Color.Gray.v500,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: Border.full,
    backgroundColor: Color.primary, alignItems: 'center', justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: Color.Gray.v400 },
});

export default HelpChatPanel;
