import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import {
  AttachmentList,
  AttachmentPicker,
} from '@/src/components/attachments';
import {
  Button,
  Card,
  ErrorNotice,
  Field,
  Loading,
  Pill,
  Screen,
  SectionTitle,
  textStyles,
  Title,
} from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { commissionProgress, formatMoney, statusLabel } from '@/src/lib/commission';
import { colours, radii } from '@/src/theme';
import type {
  Commission,
  CommissionDetail,
  MediaAttachment,
  Milestone,
} from '@/src/types';

function milestoneTone(status: Milestone['status']) {
  if (status === 'complete') return 'positive' as const;
  if (status === 'posted') return 'warning' as const;
  return 'neutral' as const;
}

type ReviewCategory = 'quality' | 'communication' | 'accuracy' | 'packaging' | 'timeline';

const reviewCategories: [ReviewCategory, string][] = [
  ['quality', 'Quality'],
  ['communication', 'Communication'],
  ['accuracy', 'Brief accuracy'],
  ['packaging', 'Packaging'],
  ['timeline', 'Timeline'],
];

const initialReviewRatings: Record<ReviewCategory, number> = {
  quality: 5,
  communication: 5,
  accuracy: 5,
  packaging: 5,
  timeline: 5,
};

export default function CommissionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token, user } = useSession();
  const [detail, setDetail] = useState<CommissionDetail | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [tracking, setTracking] = useState('');
  const [updateNotes, setUpdateNotes] = useState('');
  const [updateAttachments, setUpdateAttachments] = useState<MediaAttachment[]>([]);
  const [disputeText, setDisputeText] = useState('');
  const [disputeAttachments, setDisputeAttachments] = useState<MediaAttachment[]>([]);
  const [reviewText, setReviewText] = useState('');
  const [reviewRatings, setReviewRatings] = useState(initialReviewRatings);
  const [showDispute, setShowDispute] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!token || !id) return;
    try {
      setDetail(await api.commission(token, id));
      if (!quiet) setError('');
    } catch (caught) {
      if (!quiet) {
        setError(caught instanceof ApiError ? caught.message : 'Could not load this commission.');
      }
    }
  }, [id, token]);

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(true), 3_000);
    return () => clearInterval(interval);
  }, [load]);

  const perform = async (action: string, body: Record<string, unknown> = {}) => {
    if (!token || !id) return;
    setBusy(true);
    setError('');
    try {
      await api.commissionAction(token, id, action, body);
      setNote('');
      setPrice('');
      setTracking('');
      setDisputeText('');
      setDisputeAttachments([]);
      setReviewText('');
      setReviewRatings(initialReviewRatings);
      setShowDispute(false);
      setShowCancellation(false);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That action could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const performMilestone = async (
    milestoneId: string,
    action: 'updates' | 'approve',
    body: Record<string, unknown> = {},
  ) => {
    if (!token || !id) return;
    setBusy(true);
    setError('');
    try {
      await api.milestoneAction(token, id, milestoneId, action, body);
      setUpdateNotes('');
      setUpdateAttachments([]);
      await load();
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'That milestone could not be updated.');
    } finally {
      setBusy(false);
    }
  };

  const progress = useMemo(
    () => (detail ? commissionProgress(detail.milestones) : 0),
    [detail],
  );

  if (!detail) {
    return (
      <Screen>
        {error ? <ErrorNotice message={error} /> : <Loading />}
      </Screen>
    );
  }

  const { commission, milestones } = detail;
  const isMaker = user?.id === commission.makerId;
  const isCommissioner = user?.id === commission.commissionerId;
  const activeMilestone = milestones.find((milestone) =>
    ['active', 'posted'].includes(milestone.status),
  );
  const allMilestonesComplete =
    milestones.length > 0 && milestones.every((milestone) => milestone.status === 'complete');
  const myReview = detail.reviews.find((review) => review.reviewerId === user?.id);

  return (
    <Screen>
      <View style={styles.heading}>
        <View style={styles.flex}>
          <Pill
            tone={
              commission.status === 'complete'
                ? 'positive'
                : commission.status === 'disputed'
                  ? 'danger'
                  : 'warning'
            }>
            {statusLabel(commission.status).toUpperCase()}
          </Pill>
          <Title subtitle={`${commission.species} · ${commission.suitType} suit`}>
            {commission.title}
          </Title>
        </View>
        <View style={styles.progressRing}>
          <Text style={styles.progressValue}>{progress}%</Text>
        </View>
      </View>
      {error ? <ErrorNotice message={error} /> : null}
      <Card tone="moss">
        <View style={styles.amountRow}>
          <View>
            <Text style={textStyles.muted}>
              {commission.agreedTotal ? 'Agreed total' : 'Commissioner budget'}
            </Text>
            <Text style={styles.amount}>
              {formatMoney(commission.agreedTotal ?? commission.budget)}
            </Text>
          </View>
          {commission.depositAmount !== undefined ? (
            <View style={styles.right}>
              <Text style={textStyles.muted}>50% deposit</Text>
              <Text style={textStyles.label}>{formatMoney(commission.depositAmount)}</Text>
              <Pill tone={commission.depositPaid ? 'positive' : 'warning'}>
                {commission.depositPaid ? 'RECORDED' : 'NOT PAID'}
              </Pill>
            </View>
          ) : null}
        </View>
        <Text style={styles.simulated}>
          <Ionicons color={colours.moss} name="information-circle-outline" size={14} /> Payments are
          symbolic in this development build.
        </Text>
      </Card>
      <Card>
        <Text style={textStyles.label}>Brief</Text>
        <Text style={textStyles.body}>{commission.description}</Text>
        {commission.referenceNotes ? (
          <>
            <View style={styles.rule} />
            <Text style={textStyles.label}>Reference notes</Text>
            <Text style={textStyles.muted}>{commission.referenceNotes}</Text>
          </>
        ) : null}
      </Card>

      <ActionPanel
        activeMilestone={activeMilestone}
        allMilestonesComplete={allMilestonesComplete}
        busy={busy}
        commission={commission}
        isCommissioner={isCommissioner}
        isMaker={isMaker}
        note={note}
        onNoteChange={setNote}
        onPerform={perform}
        onPerformMilestone={performMilestone}
        onPriceChange={setPrice}
        onTrackingChange={setTracking}
        onUpdateAttachmentsChange={setUpdateAttachments}
        onUpdateNotesChange={setUpdateNotes}
        price={price}
        tracking={tracking}
        token={token}
        updateAttachments={updateAttachments}
        updateNotes={updateNotes}
      />

      {['pending', 'negotiating', 'price_proposed', 'accepted'].includes(
        commission.status,
      ) ? (
        <>
          <SectionTitle>Cancel request</SectionTitle>
          {showCancellation ? (
            <Card tone="coral">
              <Text style={textStyles.label}>Cancel this commission?</Text>
              <Text style={textStyles.muted}>
                This closes the request for both people. After a deposit is recorded, cancellation instead requires
                a dispute and human review.
              </Text>
              <Button
                disabled={busy}
                label="Keep commission"
                onPress={() => setShowCancellation(false)}
                variant="secondary"
              />
              <Button
                disabled={busy}
                label={busy ? 'Cancelling…' : 'Cancel commission'}
                onPress={() => void perform('cancel')}
                variant="danger"
              />
            </Card>
          ) : (
            <Button
              label="Cancel this commission"
              onPress={() => setShowCancellation(true)}
              variant="ghost"
            />
          )}
        </>
      ) : null}

      <SectionTitle>Build timeline</SectionTitle>
      <View style={styles.timeline}>
        {milestones.map((milestone, index) => (
          <View key={milestone.id} style={styles.milestoneRow}>
            <View style={styles.timelineRail}>
              <View
                style={[
                  styles.timelineDot,
                  milestone.status === 'complete' && styles.timelineDotComplete,
                  ['active', 'posted'].includes(milestone.status) && styles.timelineDotActive,
                ]}>
                {milestone.status === 'complete' ? (
                  <Ionicons color={colours.white} name="checkmark" size={14} />
                ) : (
                  <Text style={styles.timelineNumber}>{index + 1}</Text>
                )}
              </View>
              {index < milestones.length - 1 ? <View style={styles.timelineLine} /> : null}
            </View>
            <View style={styles.milestone}>
              <View style={styles.amountRow}>
                <Text style={[textStyles.label, styles.flex]}>{milestone.title}</Text>
                <Pill tone={milestoneTone(milestone.status)}>{milestone.status.toUpperCase()}</Pill>
              </View>
              {milestone.paymentAmount > 0 ? (
                <Text style={textStyles.muted}>
                  Symbolic release: {formatMoney(milestone.paymentAmount)}
                </Text>
              ) : null}
              {milestone.updates.map((update) => (
                <View key={update.id} style={styles.update}>
                  <Text style={textStyles.body}>{update.notes}</Text>
                  <AttachmentList attachments={update.attachments} />
                  <Text style={styles.date}>{new Date(update.createdAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
      </View>

      {detail.negotiations.length ? (
        <>
          <SectionTitle>Negotiation history</SectionTitle>
          <Card>
            {detail.negotiations.map((entry, index) => (
              <View key={entry.id} style={[styles.history, index > 0 && styles.rule]}>
                <Text style={textStyles.label}>
                  {entry.action === 'proposal'
                    ? `Price proposed · ${formatMoney(entry.amount)}`
                    : entry.action === 'accepted'
                      ? 'Price accepted'
                      : 'Price rejected'}
                </Text>
                {entry.note ? <Text style={textStyles.muted}>{entry.note}</Text> : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {commission.status === 'complete' && (isCommissioner || isMaker) && !myReview ? (
        <>
          <SectionTitle>Leave a review</SectionTitle>
          <Card>
            <Text style={textStyles.muted}>
              Rate each part of the completed commission from one to five.
            </Text>
            {reviewCategories.map(([key, label]) => (
              <View key={key} style={styles.ratingRow}>
                <Text style={[textStyles.label, styles.flex]}>{label}</Text>
                <View style={styles.ratingChoices}>
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Pressable
                      accessibilityLabel={`${label}: ${rating} out of 5`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: reviewRatings[key] === rating }}
                      key={rating}
                      onPress={() =>
                        setReviewRatings((current) => ({ ...current, [key]: rating }))
                      }
                      style={[
                        styles.ratingChoice,
                        reviewRatings[key] === rating && styles.ratingChoiceSelected,
                      ]}>
                      <Text
                        style={[
                          styles.ratingChoiceText,
                          reviewRatings[key] === rating && styles.ratingChoiceTextSelected,
                        ]}>
                        {rating}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
            <Field
              label="Comment (optional)"
              multiline
              onChangeText={setReviewText}
              placeholder="What went well?"
              value={reviewText}
            />
            <Button
              disabled={busy}
              label="Submit review"
              onPress={() =>
                void perform('reviews', {
                  ...reviewRatings,
                  comment: reviewText,
                })
              }
            />
          </Card>
        </>
      ) : null}
      {myReview ? (
        <>
          <SectionTitle>Your review</SectionTitle>
          <Card>
            <Text style={textStyles.label}>
              {(
                (myReview.quality +
                  myReview.communication +
                  myReview.accuracy +
                  myReview.packaging +
                  myReview.timeline) /
                5
              ).toFixed(1)}{' '}
              out of 5
            </Text>
            {myReview.comment ? <Text style={textStyles.body}>{myReview.comment}</Text> : null}
            <Text style={textStyles.muted}>Submitted review</Text>
          </Card>
        </>
      ) : null}

      {!['complete', 'cancelled', 'disputed'].includes(commission.status) ? (
        <>
          <SectionTitle>Something gone wrong?</SectionTitle>
          {showDispute ? (
            <Card tone="coral">
              <Text style={textStyles.label}>Raise a dispute</Text>
              <Text style={textStyles.muted}>
                This pauses the commission and opens a case for human review. Explain the issue clearly.
              </Text>
              <Field
                label="What happened?"
                multiline
                onChangeText={setDisputeText}
                placeholder="Include dates, promises, and the outcome you need"
                value={disputeText}
              />
              {token ? (
                <AttachmentPicker
                  attachments={disputeAttachments}
                  disabled={busy}
                  onChange={setDisputeAttachments}
                  token={token}
                />
              ) : null}
              <Button
                disabled={busy || !disputeText.trim()}
                label="Submit dispute"
                onPress={() =>
                  void perform('disputes', {
                    explanation: disputeText,
                    attachments: disputeAttachments,
                  })
                }
                variant="danger"
              />
              <Button label="Keep working" onPress={() => setShowDispute(false)} variant="ghost" />
            </Card>
          ) : (
            <Button label="Raise a dispute" onPress={() => setShowDispute(true)} variant="ghost" />
          )}
        </>
      ) : null}
      {detail.dispute ? (
        <Card tone="coral">
          <Text style={textStyles.label}>Dispute · {detail.dispute.status.replace('_', ' ')}</Text>
          <Text style={textStyles.body}>{detail.dispute.explanation}</Text>
          {detail.dispute.resolution ? <Text style={textStyles.muted}>{detail.dispute.resolution}</Text> : null}
        </Card>
      ) : null}
    </Screen>
  );
}

interface ActionPanelProps {
  commission: Commission;
  isMaker: boolean;
  isCommissioner: boolean;
  busy: boolean;
  price: string;
  note: string;
  tracking: string;
  updateNotes: string;
  updateAttachments: MediaAttachment[];
  token: string | null;
  activeMilestone?: Milestone;
  allMilestonesComplete: boolean;
  onPriceChange: (value: string) => void;
  onNoteChange: (value: string) => void;
  onTrackingChange: (value: string) => void;
  onUpdateAttachmentsChange: (attachments: MediaAttachment[]) => void;
  onUpdateNotesChange: (value: string) => void;
  onPerform: (action: string, body?: Record<string, unknown>) => Promise<void>;
  onPerformMilestone: (
    milestoneId: string,
    action: 'updates' | 'approve',
    body?: Record<string, unknown>,
  ) => Promise<void>;
}

function ActionPanel(props: ActionPanelProps) {
  const {
    activeMilestone,
    allMilestonesComplete,
    busy,
    commission,
    isCommissioner,
    isMaker,
    note,
    onNoteChange,
    onPerform,
    onPerformMilestone,
    onPriceChange,
    onTrackingChange,
    onUpdateAttachmentsChange,
    onUpdateNotesChange,
    price,
    tracking,
    token,
    updateAttachments,
    updateNotes,
  } = props;

  if (commission.status === 'pending' && isMaker) {
    return (
      <Card tone="coral">
        <Text style={textStyles.label}>New request</Text>
        <Text style={textStyles.muted}>Accept to begin price negotiation, or decline the request.</Text>
        <Button disabled={busy} label="Accept and discuss price" onPress={() => void onPerform('respond', { accept: true })} />
        <Button disabled={busy} label="Decline request" onPress={() => void onPerform('respond', { accept: false })} variant="secondary" />
      </Card>
    );
  }

  if (commission.status === 'negotiating' && isMaker) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Propose a price</Text>
        <Field keyboardType="decimal-pad" label="Total (£)" onChangeText={onPriceChange} placeholder="2400" value={price} />
        <Field label="Note (optional)" onChangeText={onNoteChange} placeholder="What this includes" value={note} />
        <Button disabled={busy || Number(price) <= 0} label="Send proposal" onPress={() => void onPerform('price', { amount: Number(price), note })} />
      </Card>
    );
  }

  if (commission.status === 'price_proposed' && isCommissioner) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Maker proposed {formatMoney(commission.proposedPrice)}</Text>
        <Text style={textStyles.muted}>Accepting locks this total and sets a 50% demo deposit.</Text>
        <Field label="Reply note (optional)" onChangeText={onNoteChange} placeholder="Any final questions" value={note} />
        <Button disabled={busy} label="Accept price" onPress={() => void onPerform('price-response', { accept: true, note })} />
        <Button disabled={busy} label="Reject and keep negotiating" onPress={() => void onPerform('price-response', { accept: false, note })} variant="secondary" />
      </Card>
    );
  }

  if (commission.status === 'accepted' && isCommissioner) {
    return (
      <Card tone="coral">
        <Text style={textStyles.label}>Record the demo deposit</Text>
        <Text style={textStyles.muted}>
          This changes project status only. No card details are collected and no money moves.
        </Text>
        <Button
          disabled={busy}
          label={`Record ${formatMoney(commission.depositAmount)} demo deposit`}
          onPress={() =>
            Alert.alert('Simulated payment', 'No real payment will be taken.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Record deposit', onPress: () => void onPerform('deposit') },
            ])
          }
        />
      </Card>
    );
  }

  if (commission.status === 'active' && activeMilestone?.status === 'active' && isMaker) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Post progress · {activeMilestone.title}</Text>
        <Field
          hint="Explain what changed, then attach any progress photos the commissioner should review."
          label="Update notes"
          multiline
          onChangeText={onUpdateNotesChange}
          placeholder="What changed and what should the commissioner review?"
          value={updateNotes}
        />
        {token ? (
          <AttachmentPicker
            attachments={updateAttachments}
            disabled={busy}
            onChange={onUpdateAttachmentsChange}
            token={token}
          />
        ) : null}
        <Button
          disabled={
            busy || (!updateNotes.trim() && updateAttachments.length === 0)
          }
          label="Post for approval"
          onPress={() =>
            void onPerformMilestone(activeMilestone.id, 'updates', {
              notes: updateNotes,
              attachments: updateAttachments,
            })
          }
        />
      </Card>
    );
  }

  if (commission.status === 'active' && activeMilestone?.status === 'posted' && isCommissioner) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Progress ready · {activeMilestone.title}</Text>
        <Text style={textStyles.muted}>Review the maker’s update below before releasing this symbolic milestone payment.</Text>
        <Button disabled={busy} label={`Approve · ${formatMoney(activeMilestone.paymentAmount)}`} onPress={() => void onPerformMilestone(activeMilestone.id, 'approve')} />
      </Card>
    );
  }

  if (commission.status === 'active' && allMilestonesComplete && isMaker) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Everything is approved</Text>
        <Field label="Tracking number (optional)" onChangeText={onTrackingChange} placeholder="Carrier tracking reference" value={tracking} />
        <Button disabled={busy} label="Mark as shipped" onPress={() => void onPerform('ship', { trackingNumber: tracking })} />
      </Card>
    );
  }

  if (commission.status === 'shipping' && isCommissioner) {
    return (
      <Card tone="moss">
        <Text style={textStyles.label}>Your commission is on its way</Text>
        {commission.trackingNumber ? <Text style={textStyles.body}>Tracking: {commission.trackingNumber}</Text> : null}
        <Button disabled={busy} label="Confirm safe receipt" onPress={() => void onPerform('receipt')} />
      </Card>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  heading: { alignItems: 'center', flexDirection: 'row', gap: 14 },
  flex: { flex: 1 },
  progressRing: {
    alignItems: 'center',
    backgroundColor: colours.mossSoft,
    borderColor: colours.moss,
    borderRadius: 31,
    borderWidth: 4,
    height: 62,
    justifyContent: 'center',
    width: 62,
  },
  progressValue: { color: colours.moss, fontSize: 14, fontWeight: '900' },
  amountRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 12, justifyContent: 'space-between' },
  amount: { color: colours.ink, fontSize: 28, fontWeight: '900', marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 3 },
  simulated: { color: colours.moss, fontSize: 12, fontWeight: '700' },
  rule: { borderTopColor: colours.line, borderTopWidth: 1, paddingTop: 12 },
  timeline: { gap: 0 },
  milestoneRow: { flexDirection: 'row', gap: 12 },
  timelineRail: { alignItems: 'center', width: 30 },
  timelineDot: {
    alignItems: 'center',
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: 15,
    borderWidth: 2,
    height: 30,
    justifyContent: 'center',
    width: 30,
  },
  timelineDotActive: { borderColor: colours.coral },
  timelineDotComplete: { backgroundColor: colours.moss, borderColor: colours.moss },
  timelineNumber: { color: colours.inkMuted, fontSize: 11, fontWeight: '800' },
  timelineLine: { backgroundColor: colours.line, flex: 1, width: 2 },
  milestone: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.medium,
    borderWidth: 1,
    flex: 1,
    gap: 8,
    marginBottom: 12,
    padding: 14,
  },
  update: {
    backgroundColor: colours.cream,
    borderRadius: radii.small,
    gap: 4,
    padding: 11,
  },
  date: { color: colours.inkMuted, fontSize: 10, fontWeight: '700' },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  ratingChoices: { flexDirection: 'row', gap: 6 },
  ratingChoice: {
    alignItems: 'center',
    borderColor: colours.line,
    borderRadius: 16,
    borderWidth: 1,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  ratingChoiceSelected: {
    backgroundColor: colours.moss,
    borderColor: colours.moss,
  },
  ratingChoiceText: { color: colours.ink, fontSize: 12, fontWeight: '800' },
  ratingChoiceTextSelected: { color: colours.white },
  history: { gap: 5, paddingVertical: 5 },
});
