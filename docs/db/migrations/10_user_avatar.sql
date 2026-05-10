-- 10_user_avatar.sql
-- Adds an avatar URL column to the user table to support profile pictures

ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
