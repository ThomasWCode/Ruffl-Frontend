import { Redirect } from 'expo-router';

import { Loading, Screen } from '@/src/components/ui';
import { useSession } from '@/src/context/session';

export default function IndexScreen() {
  const { loading, restriction, user } = useSession();
  if (loading) {
    return (
      <Screen scroll={false}>
        <Loading />
      </Screen>
    );
  }
  return <Redirect href={restriction ? '/suspended' : user ? '/(tabs)' : '/login'} />;
}
