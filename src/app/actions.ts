'use server';

import { supabase } from '@/utils/supabase';
import { Invitation, RSVP } from '@/types';
import { revalidatePath } from 'next/cache';

// Helper to fetch full invitation by slug
export async function getInvitationBySlug(slug: string): Promise<Partial<Invitation> | null> {
  try {
    const { data: invitation, error: inviteError } = await supabase
      .from('invitations')
      .select('*')
      .eq('slug', slug)
      .single();

    if (inviteError || !invitation) {
      console.error('Error fetching invitation:', inviteError);
      return null;
    }

    const { data: styling } = await supabase
      .from('styling_preferences')
      .select('*')
      .eq('invitation_id', invitation.id)
      .single();

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('invitation_id', invitation.id);

    const { data: gift_collection } = await supabase
      .from('gift_collection_details')
      .select('*')
      .eq('invitation_id', invitation.id)
      .single();

    return {
      ...invitation,
      styling: styling || undefined,
      events: events || [],
      gift_collection: gift_collection || undefined,
    };
  } catch (error) {
    console.error('Error in getInvitationBySlug:', error);
    return null;
  }
}

// Action to save/update full invitation data
export async function saveInvitation(invitationData: Partial<Invitation>): Promise<boolean> {
  if (!invitationData.id) return false;
  
  try {
    const { id, styling, events, gift_collection, slug, ...coreDetails } = invitationData;

    // 1. Update Core Invitation Table
    const { error: inviteError } = await supabase
      .from('invitations')
      .update({
        ...coreDetails,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (inviteError) {
      console.error('Error saving core invitation details:', inviteError);
      return false;
    }

    // 2. Update Styling Preferences
    if (styling) {
      const { error: stylingError } = await supabase
        .from('styling_preferences')
        .upsert({
          ...styling,
          invitation_id: id,
          updated_at: new Date().toISOString(),
        });
      if (stylingError) {
        console.error('Error saving styling preferences:', stylingError);
        return false;
      }
    }

    // 3. Update Events Table (delete and insert new events for simplicity)
    if (events) {
      const { error: deleteEventsError } = await supabase
        .from('events')
        .delete()
        .eq('invitation_id', id);

      if (deleteEventsError) {
        console.error('Error deleting prior events:', deleteEventsError);
        return false;
      }

      if (events.length > 0) {
        const eventsToInsert = events.map(e => ({
          invitation_id: id,
          event_name: e.event_name,
          event_date: e.event_date,
          event_time: e.event_time,
          venue_name: e.venue_name,
          venue_address: e.venue_address,
          google_maps_link: e.google_maps_link,
        }));

        const { error: insertEventsError } = await supabase
          .from('events')
          .insert(eventsToInsert);

        if (insertEventsError) {
          console.error('Error inserting events:', insertEventsError);
          return false;
        }
      }
    }

    // 4. Update Gift Details
    if (gift_collection) {
      const { error: giftError } = await supabase
        .from('gift_collection_details')
        .upsert({
          ...gift_collection,
          invitation_id: id,
          updated_at: new Date().toISOString(),
        });

      if (giftError) {
        console.error('Error saving gift collection details:', giftError);
        return false;
      }
    }

    // Revalidate paths
    if (slug) {
      revalidatePath(`/invite/${slug}`);
      revalidatePath(`/dashboard/edit/${slug}`);
    }

    return true;
  } catch (error) {
    console.error('Error in saveInvitation action:', error);
    return false;
  }
}

// Action to submit RSVP
export async function submitRsvp(rsvp: Omit<RSVP, 'id' | 'created_at'>): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('rsvp')
      .insert(rsvp);

    if (error) {
      console.error('Error submitting RSVP:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in submitRsvp action:', error);
    return false;
  }
}

// Action to trigger a mock gift transaction click
export async function registerGiftClick(invitationId: string, senderName: string, amount: number, message: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('gift_transactions')
      .insert({
        invitation_id: invitationId,
        sender_name: senderName,
        amount,
        message,
        status: 'completed' // Simple completed state for mock UPI click logs
      });

    if (error) {
      console.error('Error registering gift click:', error);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error in registerGiftClick action:', error);
    return false;
  }
}
