import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { api, ApiError } from '@/src/api/client';
import { Button, Card, ErrorNotice, Field, Screen, textStyles, Title } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours, radii } from '@/src/theme';
import type { Commission } from '@/src/types';

const suitTypes: Commission['suitType'][] = ['head', 'partial', 'full', 'custom'];

export default function RequestCommissionScreen() {
  const { makerId } = useLocalSearchParams<{ makerId: string }>();
  const { token } = useSession();
  const [title, setTitle] = useState('');
  const [suitType, setSuitType] = useState<Commission['suitType']>('partial');
  const [species, setSpecies] = useState('');
  const [description, setDescription] = useState('');
  const [referenceNotes, setReferenceNotes] = useState('');
  const [budget, setBudget] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!token || !makerId) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createCommission(token, {
        makerId,
        title,
        suitType,
        species,
        description,
        referenceNotes,
        budget: Number(budget),
      });
      router.replace({ pathname: '/commissions/[id]', params: { id: result.commission.id } });
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Could not send your request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <Title subtitle="This starts a negotiation. The maker will propose the final price.">
        Tell them what you have in mind
      </Title>
      <Card tone="coral">
        <Text style={textStyles.label}>Your budget is a guide, not a checkout price</Text>
        <Text style={textStyles.muted}>
          Nothing is charged when you submit. Any later deposit is simulated in this development build.
        </Text>
      </Card>
      <Field label="Project title" onChangeText={setTitle} placeholder="Aurora fox partial" value={title} />
      <View style={styles.choices}>
        {suitTypes.map((type) => (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: suitType === type }}
            key={type}
            onPress={() => setSuitType(type)}
            style={[styles.choice, suitType === type && styles.choiceSelected]}>
            <Text style={[styles.choiceText, suitType === type && styles.choiceTextSelected]}>
              {type[0]?.toUpperCase()}{type.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <Field label="Species" onChangeText={setSpecies} placeholder="Fox, wolf, dragon…" value={species} />
      <Field
        label="Description"
        multiline
        onChangeText={setDescription}
        placeholder="Colours, expression, features, and intended use"
        value={description}
      />
      <Field
        hint="Links or notes are fine. Media upload is available once the request exists."
        label="Reference notes"
        multiline
        onChangeText={setReferenceNotes}
        placeholder="Reference sheet notes or URLs"
        value={referenceNotes}
      />
      <Field
        keyboardType="decimal-pad"
        label="Rough budget (£)"
        onChangeText={setBudget}
        placeholder="2500"
        value={budget}
      />
      {error ? <ErrorNotice message={error} /> : null}
      <Button
        disabled={submitting}
        label={submitting ? 'Sending request…' : 'Send commission request'}
        onPress={() => void submit()}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: {
    backgroundColor: colours.surface,
    borderColor: colours.line,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  choiceSelected: { backgroundColor: colours.moss, borderColor: colours.moss },
  choiceText: { color: colours.ink, fontSize: 13, fontWeight: '800' },
  choiceTextSelected: { color: colours.white },
});
