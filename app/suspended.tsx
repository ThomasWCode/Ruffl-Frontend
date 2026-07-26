import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, textStyles, Title } from '@/src/components/ui';
import { useSession } from '@/src/context/session';
import { colours } from '@/src/theme';

export default function SuspendedScreen() {
  const { dismissRestriction, restriction } = useSession();
  const deleted = restriction?.code === 'ACCOUNT_DELETED';

  return (
    <Screen>
      <View style={styles.icon}>
        <Ionicons
          color={colours.danger}
          name={deleted ? 'person-remove-outline' : 'lock-closed-outline'}
          size={34}
        />
      </View>
      <Title
        subtitle={
          deleted
            ? 'This account can no longer sign in.'
            : 'Ruffl has temporarily blocked authenticated access to this account.'
        }>
        {deleted ? 'Account deleted' : 'Account suspended'}
      </Title>
      <Card tone="coral">
        <Text style={textStyles.label}>Current account status</Text>
        <Text style={textStyles.body}>
          {restriction?.message ?? 'Contact Ruffl support for the current account status.'}
        </Text>
      </Card>
      <Card>
        <Text style={textStyles.label}>Need help?</Text>
        <Text style={textStyles.muted}>
          Contact the support address configured by the Ruffl operator. Include your account email
          and do not send passwords or payment details.
        </Text>
      </Card>
      <Button
        label="Return to sign in"
        onPress={() => {
          dismissRestriction();
          router.replace('/login');
        }}
        variant="secondary"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    backgroundColor: colours.coralSoft,
    borderRadius: 32,
    height: 64,
    justifyContent: 'center',
    marginTop: 50,
    width: 64,
  },
});
