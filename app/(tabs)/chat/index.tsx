/**
 * FAQ Chatbot Screen
 * 
 * Keyword-matching chatbot that answers common questions about town services.
 * Uses FAQ database (faq.json) and keyword matching algorithm to find answers.
 * Features message history, typing indicator, bot avatar, timestamps,
 * and fallback suggestions when no match found. Messages persist during session.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Linking,
  Alert,
  Keyboard,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { faq, contacts } from '../../../data';
import { answerFor } from '../../../utils/keywordMatch';
import { theme } from '../../../theme';
import { BusinessModal } from '../../../components/BusinessModal';
import type { Business, Contact } from '../../../data';
import { fetchBusinesses } from '../../../services/supabase';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const INITIAL_MESSAGE: Message = {
  id: '0',
  text: "Welcome to the Town of Amherst virtual assistant! I can help you find information on Town services, schedules, community resources, and contacts — from taxes and waste collection to permits, recreation, and Council. What can I help you with today?",
  isUser: false,
  timestamp: new Date(),
};

export default function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [showBusinessModal, setShowBusinessModal] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardVisible(true);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Load businesses from Supabase so business name detection/links stay in sync with the Directory
  useEffect(() => {
    const loadBusinesses = async () => {
      try {
        const data = await fetchBusinesses();
        setBusinesses(
          data.map((b) => ({
            id: b.id,
            name: b.name,
            category: b.category,
            description: b.description,
            phone: b.phone,
            address: b.address,
            website: b.website || null,
            rating: b.rating || 0,
            reviewCount: b.review_count || 0,
          }))
        );
      } catch (err) {
        console.error('Failed to load businesses for chat:', err);
      }
    };

    loadBusinesses();
  }, []);

  // Common short words that shouldn't count as a meaningful title/department
  // match on their own (avoids "Town Hall Reception" matching any query
  // that merely contains the word "town").
  const CONTACT_STOPWORDS = new Set([
    'and', 'the', 'for', 'of', 'to', 'in', 'on', 'a', 'an', 'is', 'are',
    'town', 'department', 'services', 'service', 'general', 'office',
  ]);

  const hasWholeWord = (text: string, word: string): boolean => {
    if (!word || CONTACT_STOPWORDS.has(word)) return false;
    return new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(text);
  };

  const findContactInfo = (query: string): string | null => {
    const lowerQuery = query.toLowerCase();

    // Check for contact queries by name, title, or department using whole-word
    // matching (substring matching previously caused false positives, e.g.
    // any query containing "town" matching "Town Hall Reception").
    const matchedContact = contacts.find(contact => {
      const nameLower = contact.name.toLowerCase();
      if (hasWholeWord(lowerQuery, nameLower) || nameLower.includes(lowerQuery)) {
        return true;
      }

      const titleWords = contact.title.toLowerCase().split(/\s+/);
      const deptWords = contact.department.toLowerCase().split(/\s+/);

      return (
        titleWords.some(word => word.length > 3 && hasWholeWord(lowerQuery, word)) ||
        deptWords.some(word => word.length > 3 && hasWholeWord(lowerQuery, word))
      );
    });

    if (matchedContact) {
      return `📞 ${matchedContact.name}\n${matchedContact.title}\n${matchedContact.department}\n\nPhone: ${matchedContact.phone}\nEmail: ${matchedContact.email}`;
    }

    // Check for general department queries
    const departmentKeywords: Record<string, string[]> = {
      'town hall': ['town hall', 'customer service', 'general inquiry', 'contact town'],
      'building': ['building', 'permit', 'construction', 'renovation', 'inspection'],
      'planning': ['planning', 'zoning', 'development', 'official plan', 'site plan'],
      'fire': ['fire', 'fire department', 'amherst fire'],
      'police': ['police', 'apd', 'amherst police', 'non emergency'],
      'animal': ['animal', 'pet', 'dog', 'cat', 'wildlife', 'coyote'],
      'accessibility': ['accessibility', 'aide', 'accessible', 'barrier', 'accommodation'],
      'roads': ['roads', 'traffic', 'winter', 'plow', 'snow', 'road closure'],
      'finance': ['tax', 'taxes', 'budget', 'finance', 'financial', 'fees', 'charges'],
      'water': ['water', 'sewer', 'utility', 'watermain', 'billing'],
    };

    for (const [dept, keywords] of Object.entries(departmentKeywords)) {
      if (keywords.some(keyword => lowerQuery.includes(keyword))) {
        const deptContacts = contacts.filter(c =>
          c.department.toLowerCase().includes(dept) ||
          c.title.toLowerCase().includes(dept)
        );

        if (deptContacts.length > 0) {
          return deptContacts.map(c =>
            `📞 ${c.name}\n${c.title}\n\nPhone: ${c.phone}\nEmail: ${c.email}`
          ).join('\n\n');
        }
      }
    }

    return null;
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate typing delay (700-1000ms)
    const delay = 700 + Math.random() * 300;
    setTimeout(() => {
      // Check FAQ first for certain topics (bills, taxes, permits)
      const lowerQuery = userMessage.text.toLowerCase();
      const faqPriorityTopics = ['bill', 'tax', 'permit', 'license', 'pay', 'payment', 'construction', 'building'];
      const shouldCheckFaqFirst = faqPriorityTopics.some(topic => lowerQuery.includes(topic));
      
      if (shouldCheckFaqFirst) {
        // Check FAQ first for these topics
        const answer = answerFor(userMessage.text, faq);
        if (answer) {
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: answer,
            isUser: false,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, botMessage]);
          setIsTyping(false);
          return;
        }
      }
      
      // Then check for contact information
      const contactInfo = findContactInfo(userMessage.text);
      
      if (contactInfo) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: contactInfo,
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
        setIsTyping(false);
        return;
      }
      
      // Finally check FAQ for everything else
      const answer = answerFor(userMessage.text, faq);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: answer || "I don't have specific information about that, but I can help with many Amherst topics including:\n\n• Town Hall hours & general services\n• Property taxes & water billing\n• Garbage, recycling & compost collection\n• Building permits & inspections\n• Parking tickets & payments\n• Recreation programs & registration\n• Winter maintenance & road closures\n• Planning & zoning\n• Animal services & pet licences\n• Council meetings & agendas\n\nOr contact Town Hall directly:\n📞 902-667-3352 | 📧 info@amherst.ca\n🌐 https://www.amherst.ca/government.html",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, delay);
  };

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, isTyping]);

  // Handle URL clicks with confirmation
  const handleUrlPress = (url: string) => {
    // Add https:// if URL doesn't have a protocol
    let fullUrl = url;
    if (!url.match(/^https?:\/\//i)) {
      fullUrl = 'https://' + url;
    }
    
    Alert.alert(
      'Open Link',
      `Do you want to open this link in your browser?\n\n${url}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open',
          onPress: async () => {
            try {
              const supported = await Linking.canOpenURL(fullUrl);
              if (supported) {
                await Linking.openURL(fullUrl);
              } else {
                Alert.alert('Error', 'Unable to open this URL');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to open URL');
            }
          },
        },
      ]
    );
  };

  // Handle phone number clicks with confirmation
  const handlePhonePress = (phoneNumber: string) => {
    // Clean phone number by removing non-digit characters except + at start
    const cleanedNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    Alert.alert(
      'Call',
      `Do you want to call this number?\n\n${phoneNumber}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Call',
          onPress: async () => {
            try {
              const phoneUrl = `tel:${cleanedNumber}`;
              const supported = await Linking.canOpenURL(phoneUrl);
              if (supported) {
                await Linking.openURL(phoneUrl);
              } else {
                Alert.alert('Error', 'Unable to make phone calls on this device');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to initiate call');
            }
          },
        },
      ]
    );
  };

  // Handle business link clicks - show modal
  const handleBusinessPress = (businessName: string, businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (!business) {
      return;
    }

    setSelectedBusiness(business);
    setShowBusinessModal(true);
  };

  // Handle viewing business in directory from modal
  const handleViewInDirectory = (businessId: string) => {
    router.push(`/(tabs)/directory/${businessId}`);
  };

  // Handle email clicks with confirmation
  const handleEmailPress = (email: string) => {
    Alert.alert(
      'Send Email',
      `Do you want to send an email to ${email}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Open',
          onPress: async () => {
            try {
              const emailUrl = `mailto:${email}`;
              const supported = await Linking.canOpenURL(emailUrl);
              if (supported) {
                await Linking.openURL(emailUrl);
              } else {
                Alert.alert('Error', 'Unable to open email client');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to open email');
            }
          },
        },
      ]
    );
  };

  // Parse text and render with clickable links, phone numbers, emails, and business links
  const renderMessageText = (text: string, isUser: boolean) => {
    // Regex patterns for URLs, emails, and phone numbers
    // URL pattern matches:
    // - Full URLs: https://example.com, http://example.com
    // - www URLs: www.example.com
    // - Domain URLs: example.com, subdomain.example.com, example.com/path
    // Updated to capture full domain including all segments and TLDs
    const urlPattern = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?:\/[^\s]*)?)/gi;
    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    // Phone pattern handles various formats including unicode characters used in FAQ
    // Matches: (902) 667-3352, 902-667-3352, 902.667.3352, 902 667 3352, +1-902-667-3352
    // Also handles unicode non-breaking spaces and special hyphens
    const phonePattern = /(\+?1[\s\-\u00a0\u2011]?)?\(?(\d{3})\)?[\s\-\.\u00a0\u2011]?(\d{3})[\s\-\.\u00a0\u2011]?(\d{4})/g;
    
    const parts: Array<{ type: 'text' | 'url' | 'phone' | 'email' | 'business'; content: string; businessId?: string }> = [];
    let lastIndex = 0;
    
    // Find all URLs, emails, and phone numbers
    const urlMatches = Array.from(text.matchAll(new RegExp(urlPattern)));
    const emailMatches = Array.from(text.matchAll(new RegExp(emailPattern)));
    const phoneMatches = Array.from(text.matchAll(new RegExp(phonePattern)));
    
    // Find all business name matches
    const businessMatches: Array<{ match: RegExpMatchArray; business: typeof businesses[0] }> = [];
    businesses.forEach(business => {
      // Create a regex to match the exact business name (case-insensitive)
      const businessPattern = new RegExp(`\\b${business.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      const matches = Array.from(text.matchAll(businessPattern));
      matches.forEach(match => {
        businessMatches.push({ match, business });
      });
    });
    
    // Combine all candidate matches. Priority matters because the generic
    // URL pattern's bare-domain alternative also matches the domain portion
    // *inside* an email address (e.g. the "amherst.ca" inside
    // "info@amherst.ca"), which overlaps with the email match. Business
    // names and emails/phones are more specific, so they should win over a
    // generic URL match when spans overlap.
    const TYPE_PRIORITY = { business: 0, email: 1, phone: 2, url: 3 } as const;
    const candidates = [
      ...urlMatches.map(m => ({ type: 'url' as const, match: m, business: undefined })),
      ...emailMatches.map(m => ({ type: 'email' as const, match: m, business: undefined })),
      ...phoneMatches.map(m => ({ type: 'phone' as const, match: m, business: undefined })),
      ...businessMatches.map(({ match, business }) => ({ type: 'business' as const, match, business })),
    ].sort((a, b) => {
      const indexDiff = (a.match.index || 0) - (b.match.index || 0);
      if (indexDiff !== 0) return indexDiff;
      return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    });

    // Drop any match whose span overlaps a previously accepted (higher- or
    // equal-priority) match, so e.g. a spurious URL match inside an email
    // address never gets rendered as a duplicate link.
    const allMatches: typeof candidates = [];
    let occupiedUntil = 0;
    for (const candidate of candidates) {
      const start = candidate.match.index || 0;
      const end = start + candidate.match[0].length;
      if (start < occupiedUntil) continue;
      allMatches.push(candidate);
      occupiedUntil = end;
    }

    // Build parts array with text, urls, phone numbers, and business links
    allMatches.forEach(({ type, match, business }) => {
      const matchIndex = match.index || 0;
      
      // Add text before the match
      if (matchIndex > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, matchIndex),
        });
      }
      
      // Add the match
      if (type === 'business' && business) {
        parts.push({
          type,
          content: match[0],
          businessId: business.id,
        });
      } else {
        parts.push({
          type,
          content: match[0],
        });
      }
      
      lastIndex = matchIndex + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }
    
    // If no matches found, return simple text
    if (parts.length === 0) {
      return (
        <Text style={[styles.messageText, isUser && styles.userText]}>
          {text}
        </Text>
      );
    }
    
    // Render text with clickable links, emails, phone numbers, and business links
    return (
      <Text style={[styles.messageText, isUser && styles.userText]}>
        {parts.map((part, index) => {
          if (part.type === 'url') {
            return (
              <Text
                key={index}
                style={isUser ? styles.linkTextOnUser : styles.linkText}
                onPress={() => handleUrlPress(part.content)}
              >
                {part.content}
              </Text>
            );
          } else if (part.type === 'email') {
            return (
              <Text
                key={index}
                style={isUser ? styles.linkTextOnUser : styles.emailText}
                onPress={() => handleEmailPress(part.content)}
              >
                {part.content}
              </Text>
            );
          } else if (part.type === 'phone') {
            return (
              <Text
                key={index}
                style={isUser ? styles.linkTextOnUser : styles.phoneText}
                onPress={() => handlePhonePress(part.content)}
              >
                {part.content}
              </Text>
            );
          } else if (part.type === 'business' && part.businessId) {
            return (
              <Text
                key={index}
                style={isUser ? styles.linkTextOnUser : styles.businessText}
                onPress={() => handleBusinessPress(part.content, part.businessId!)}
              >
                {part.content}
              </Text>
            );
          } else {
            return <Text key={index}>{part.content}</Text>;
          }
        })}
      </Text>
    );
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const content = (
      <View
        style={[
          styles.messageBubble,
          item.isUser ? styles.userBubble : styles.botBubble,
        ]}
      >
        {!item.isUser && (
          <View style={styles.botAvatar}>
            <Image 
              source={require('../../../assets/amherst-crest.jpg')} 
              style={styles.botAvatarImage}
              resizeMode="contain"
            />
          </View>
        )}
        <View style={[styles.messageContent, item.isUser && styles.userMessageContent]}>
          {!item.isUser && (
            <Text style={styles.botName}>Amherst Assistant</Text>
          )}
          {renderMessageText(item.text, item.isUser)}
          <Text style={[styles.timestamp, item.isUser && styles.userTimestamp]}>
            {item.timestamp.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            })}
          </Text>
        </View>
      </View>
    );

    return item.isUser ? (
      <View style={styles.userMessageContainer}>{content}</View>
    ) : (
      <View style={styles.botMessageContainer}>{content}</View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Amherst Assistant is typing...</Text>
        </View>
      )}

      {keyboardVisible && (
        <TouchableOpacity
          style={styles.closeKeyboardButton}
          onPress={() => Keyboard.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Close keyboard"
        >
          <View style={styles.closeKeyboardContent}>
            <MaterialCommunityIcons name="chevron-down" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.closeKeyboardText}>Close Keyboard</Text>
          </View>
        </TouchableOpacity>
      )}

      <View style={[styles.inputContainer, { paddingBottom: theme.spacing.md + insets.bottom + 76 }]}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Ask a question..."
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          maxLength={500}
          accessibilityLabel="Message input"
        />
        <TouchableOpacity
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim()}
          accessibilityRole="button"
          accessibilityLabel="Send message"
        >
          <MaterialCommunityIcons 
            name="send" 
            size={20} 
            color={inputText.trim() ? '#fff' : theme.colors.textMuted} 
          />
        </TouchableOpacity>
      </View>

      <BusinessModal
        visible={showBusinessModal}
        business={selectedBusiness}
        onClose={() => setShowBusinessModal(false)}
        onViewInDirectory={handleViewInDirectory}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  topDivider: {
    height: 2,
    backgroundColor: theme.colors.brand,
  },
  messagesList: {
    padding: theme.spacing.lg,
  },
  userMessageContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
  },
  botMessageContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
  },
  messageBubble: {
    maxWidth: '85%',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  userBubble: {
    backgroundColor: theme.colors.brand,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomRightRadius: theme.borderRadius.sm,
    ...theme.shadows.small,
  },
  botBubble: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  botAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
    overflow: 'hidden',
  },
  botAvatarImage: {
    width: 32,
    height: 32,
  },
  botAvatarText: {
    fontSize: 18,
  },
  messageContent: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderBottomLeftRadius: theme.borderRadius.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  // User messages already sit inside the blue userBubble, so the inner
  // card styling (white background/border/padding) must be removed —
  // otherwise the white user text renders on a white card (invisible).
  userMessageContent: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  botName: {
    ...theme.typography.caption,
    color: theme.colors.brand,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  messageText: {
    ...theme.typography.body,
    color: theme.colors.text,
    lineHeight: theme.typography.body.lineHeight,
  },
  userText: {
    color: '#fff',
  },
  timestamp: {
    ...theme.typography.small,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.xs,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  linkText: {
    color: theme.colors.brand,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  // Links/emails/phone numbers/business names inside a user's own message
  // sit on the blue bubble, so they need a light color instead of the
  // brand blue (which is nearly invisible on the same blue background).
  linkTextOnUser: {
    color: '#fff',
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  emailText: {
    color: theme.colors.accent,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  phoneText: {
    color: theme.colors.accent,
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  businessText: {
    color: theme.colors.brand,
    textDecorationLine: 'underline',
    fontWeight: '700',
  },
  typingIndicator: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  typingText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  closeKeyboardButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  closeKeyboardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
  },
  closeKeyboardText: {
    fontSize: theme.typography.caption.fontSize,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.backgroundLight,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 100,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    fontFamily: theme.typography.body.fontFamily,
    fontSize: theme.typography.body.fontSize,
    color: theme.colors.text,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sendButton: {
    backgroundColor: theme.colors.primary,
    width: 46,
    height: 46,
    borderRadius: theme.borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.small,
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  sendButtonText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: '#fff',
  },
});
