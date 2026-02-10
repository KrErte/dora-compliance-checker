-- Add event_data column to tracking_events table for storing additional event context
ALTER TABLE tracking_events ADD COLUMN event_data VARCHAR(4000);
