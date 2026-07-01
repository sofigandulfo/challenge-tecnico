import { SubscriptionsClient } from "@/features/subscriptions/subscriptions-client";
import {
  getCategories,
  getUserSubscriptions,
} from '@/lib/subscriptions/queries';
import { createClient } from '@/lib/supabase/server';

export default async function SubscriptionsPage() {
  const supabase = createClient();
  const [subscriptions, categories] = await Promise.all([
    getUserSubscriptions(supabase),
    getCategories(supabase),
  ]);

  return (
    <SubscriptionsClient subscriptions={subscriptions} categories={categories} />
  );
}
