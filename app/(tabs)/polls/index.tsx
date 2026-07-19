/**
 * Community Polls Screen
 * 
 * Interactive voting interface for Amherst community polls.
 * Users can vote once per poll, then see live results with percentage bars,
 * vote counts, and "Your Vote" indicator. Shows leading option with trophy badge.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Card } from '../../../components/Card';
import { PercentBar } from '../../../components/PercentBar';
import { polls as pollsData, Poll } from '../../../data';
import { theme } from '../../../theme';

export default function PollsScreen() {
  const [polls, setPolls] = useState<Poll[]>(pollsData);
  const [votedPolls, setVotedPolls] = useState<Record<string, string>>({});

  const handleVote = (pollId: string, optionId: string) => {
    if (votedPolls[pollId]) return;

    setPolls(polls.map(poll => {
      if (poll.id === pollId) {
        return {
          ...poll,
          options: poll.options.map(option =>
            option.id === optionId
              ? { ...option, votes: option.votes + 1 }
              : option
          ),
        };
      }
      return poll;
    }));
    
    setVotedPolls({ ...votedPolls, [pollId]: optionId });
  };

  const renderVotingInterface = (poll: Poll) => (
    <View style={styles.votingContainer}>
      <Text style={styles.instructionText}>Select your choice below</Text>
      {poll.options.map((option, index) => (
        <TouchableOpacity
          key={option.id}
          style={styles.optionButton}
          onPress={() => handleVote(poll.id, option.id)}
          accessibilityRole="button"
          accessibilityLabel={`Vote for ${option.text}`}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryLight]}
            style={styles.optionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.optionContent}>
              <View style={styles.optionNumber}>
                <Text style={styles.optionNumberText}>{String.fromCharCode(65 + index)}</Text>
              </View>
              <Text style={styles.optionText}>{option.text}</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderResults = (poll: Poll, selectedOption: string) => {
    const totalVotes = poll.options.reduce((sum, option) => sum + option.votes, 0);
    const winner = poll.options.reduce((prev, current) =>
      current.votes > prev.votes ? current : prev
    );

    return (
      <View style={styles.resultsContainer}>
        <View style={styles.resultsHeader}>
          <View>
            <Text style={styles.resultsTitle}>Poll Results</Text>
            <Text style={styles.resultsSubtitle}>
              {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} collected
            </Text>
          </View>
          <View style={styles.statusBadge}>
            <MaterialCommunityIcons name="check-circle" size={16} color={theme.colors.white} />
            <Text style={styles.statusText}>VOTED</Text>
          </View>
        </View>

        <View style={styles.resultsContent}>
          {poll.options.map((option) => {
            const percentage = totalVotes > 0 ? (option.votes / totalVotes) * 100 : 0;
            const isWinner = option.id === winner.id && totalVotes > 0;
            const isSelected = option.id === selectedOption;

            return (
              <View key={option.id} style={styles.resultItem}>
                <PercentBar
                  label={option.text}
                  percentage={percentage}
                  votes={option.votes}
                />
                {isSelected && (
                  <View style={styles.yourVoteBadge}>
                    <Text style={styles.yourVoteText}>Your Vote</Text>
                  </View>
                )}
                {isWinner && totalVotes > 1 && (
                  <View style={styles.winnerBadge}>
                    <MaterialCommunityIcons name="trophy" size={16} color="#FFD700" />
                    <Text style={styles.winnerText}>Leading Choice</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.backgroundLight, theme.colors.background]}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.overline}>Town of Amherst</Text>
          <Text style={styles.pageTitle}>Community Polls</Text>
          <Text style={styles.pageSubtitle}>
            Your voice matters. Share your input on the decisions shaping Amherst.
          </Text>
        </View>

        {polls.map((poll, index) => {
          const hasVoted = !!votedPolls[poll.id];
          
          return (
            <View key={poll.id}>
              <Card variant="elevated" gradient={false}>
                <View style={styles.pollCard}>
                  <View style={styles.questionSection}>
                    <View style={styles.activePill}>
                      <View style={styles.activeDot} />
                      <Text style={styles.activePillText}>Active Community Poll</Text>
                    </View>
                    <Text style={styles.question}>{poll.question}</Text>
                    {poll.description && (
                      <Text style={styles.description}>{poll.description}</Text>
                    )}
                  </View>

                  {!hasVoted ? renderVotingInterface(poll) : renderResults(poll, votedPolls[poll.id])}
                </View>
              </Card>

              {hasVoted && (
                <Text style={styles.thankYouText}>
                  Thank you for participating in this community poll!
                </Text>
              )}

              {index < polls.length - 1 && <View style={styles.pollDivider} />}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: 140,
  },
  header: {
    marginBottom: theme.spacing.lg,
  },
  overline: {
    ...theme.typography.label,
    color: theme.colors.accentDark,
    marginBottom: theme.spacing.xs,
  },
  pageTitle: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  pageSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  pollCard: {
    gap: theme.spacing.lg,
  },
  questionSection: {
    marginBottom: theme.spacing.lg,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.md,
  },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: theme.colors.success,
  },
  activePillText: {
    ...theme.typography.label,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  question: {
    ...theme.typography.title,
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  description: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  votingContainer: {
    gap: theme.spacing.sm,
  },
  instructionText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.sm,
  },
  optionButton: {
    borderRadius: theme.borderRadius.lg,
    overflow: 'hidden',
    ...theme.shadows.medium,
  },
  optionGradient: {
    padding: theme.spacing.md,
    minHeight: 64,
    justifyContent: 'center',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  optionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionNumberText: {
    ...theme.typography.bodyBold,
    color: '#fff',
  },
  optionText: {
    ...theme.typography.body,
    color: '#fff',
    flex: 1,
  },
  resultsContainer: {
    gap: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.brand,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceElevated,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: `${theme.colors.brand}40`,
  },
  resultsTitle: {
    ...theme.typography.heading,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  resultsSubtitle: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.success,
    paddingLeft: 8,
    paddingRight: 10,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginLeft: 4,
  },
  resultsContent: {
    gap: theme.spacing.md,
  },
  resultItem: {
    gap: theme.spacing.xs,
  },
  yourVoteBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brand,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  yourVoteText: {
    ...theme.typography.label,
    color: theme.colors.white,
    fontSize: 10,
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  winnerText: {
    ...theme.typography.label,
    color: '#fff',
    fontSize: 10,
  },
  thankYouText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.lg,
    fontStyle: 'italic',
  },
  pollDivider: {
    height: theme.spacing.xl,
  },
});
