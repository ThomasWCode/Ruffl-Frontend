import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Field, Pill, Screen, SectionTitle, textStyles, Title } from '@/src/components/ui';
import { calculatePrice, formatMoney } from '@/src/lib/commission';
import { colours } from '@/src/theme';

function numeric(value: string): number {
  return Number(value.replace(/[^0-9.]/g, '')) || 0;
}

export default function ToolsScreen() {
  const [base, setBase] = useState('1800');
  const [addOns, setAddOns] = useState('250');
  const [shipping, setShipping] = useState('75');
  const [fee, setFee] = useState('5');
  const result = useMemo(
    () => calculatePrice(numeric(base), [numeric(addOns)], numeric(shipping), numeric(fee)),
    [addOns, base, fee, shipping],
  );

  return (
    <Screen>
      <Title subtitle="Private, local estimates. Nothing here is saved to a commission.">Commission calculator</Title>
      <View style={styles.grid}>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Base price (£)" onChangeText={setBase} value={base} />
        </View>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Add-ons (£)" onChangeText={setAddOns} value={addOns} />
        </View>
      </View>
      <View style={styles.grid}>
        <View style={styles.flex}>
          <Field keyboardType="decimal-pad" label="Shipping (£)" onChangeText={setShipping} value={shipping} />
        </View>
        <View style={styles.flex}>
          <Field
            hint="Planning estimate only"
            keyboardType="decimal-pad"
            label="Platform fee (%)"
            onChangeText={setFee}
            value={fee}
          />
        </View>
      </View>
      <Card tone="moss">
        <Pill tone="positive">ESTIMATED CUSTOMER TOTAL</Pill>
        <Text style={styles.total}>{formatMoney(result.total)}</Text>
        <View style={styles.rule} />
        <View style={styles.row}>
          <Text style={textStyles.muted}>50% demo deposit</Text>
          <Text style={textStyles.label}>{formatMoney(result.deposit)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={textStyles.muted}>Estimated platform fee</Text>
          <Text style={textStyles.label}>{formatMoney(result.estimatedFee)}</Text>
        </View>
        <View style={styles.row}>
          <Text style={textStyles.muted}>Estimated maker payout</Text>
          <Text style={textStyles.label}>{formatMoney(result.makerPayout)}</Text>
        </View>
      </Card>
      <SectionTitle>Typical starting points</SectionTitle>
      <Card>
        <View style={styles.row}>
          <Text style={textStyles.label}>Head</Text>
          <Text style={textStyles.muted}>£800–£1,500+</Text>
        </View>
        <View style={[styles.row, styles.rule]}>
          <Text style={textStyles.label}>Partial</Text>
          <Text style={textStyles.muted}>£1,600–£3,000+</Text>
        </View>
        <View style={[styles.row, styles.rule]}>
          <Text style={textStyles.label}>Full suit</Text>
          <Text style={textStyles.muted}>£3,200–£6,000+</Text>
        </View>
      </Card>
      <Text style={styles.disclaimer}>
        These example ranges are product placeholders, not market research or a promise of price. Makers should set their own costs.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  total: { color: colours.ink, fontSize: 36, fontWeight: '900', letterSpacing: -1 },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  rule: { borderTopColor: '#C7D9CC', borderTopWidth: 1, paddingTop: 13 },
  disclaimer: { color: colours.inkMuted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
