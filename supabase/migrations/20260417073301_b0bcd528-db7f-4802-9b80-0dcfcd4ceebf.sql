
-- Telegram poll state (singleton)
CREATE TABLE public.telegram_bot_state (
  id INT PRIMARY KEY CHECK (id = 1),
  update_offset BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.telegram_bot_state (id, update_offset) VALUES (1, 0);
ALTER TABLE public.telegram_bot_state ENABLE ROW LEVEL SECURITY;
-- No policies → only service_role can access

-- Conversations
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL, -- 'telegram', 'whatsapp', 'sms', 'messenger'
  external_id TEXT NOT NULL, -- e.g. telegram chat_id
  contact_name TEXT,
  contact_handle TEXT,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  unread_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel, external_id)
);
CREATE INDEX idx_conversations_user ON public.conversations(user_id, last_message_at DESC);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversations" ON public.conversations
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users insert own conversations" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own conversations" ON public.conversations
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users delete own conversations" ON public.conversations
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Messages
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  sender TEXT, -- 'user', 'ai', 'agent', 'contact'
  content TEXT NOT NULL,
  external_message_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, failed, ai_reply
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_user ON public.messages(user_id, created_at DESC);
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own messages" ON public.messages
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users insert own messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own messages" ON public.messages
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users delete own messages" ON public.messages
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Leads
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source TEXT NOT NULL, -- 'telegram', 'whatsapp', 'webhook', 'form', etc.
  channel TEXT,
  contact_name TEXT,
  contact_handle TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new', -- new, contacted, qualified, won, lost
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_leads_user ON public.leads(user_id, created_at DESC);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own leads" ON public.leads
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users insert own leads" ON public.leads
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own leads" ON public.leads
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users delete own leads" ON public.leads
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Channel settings (per-user channel config: which user owns the bot, AI auto-reply on/off, system prompt)
CREATE TABLE public.channel_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  channel TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  ai_auto_reply BOOLEAN NOT NULL DEFAULT true,
  system_prompt TEXT DEFAULT 'You are a helpful customer support assistant. Be concise and friendly.',
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, channel)
);
ALTER TABLE public.channel_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own channel settings" ON public.channel_settings
  FOR SELECT USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users insert own channel settings" ON public.channel_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own channel settings" ON public.channel_settings
  FOR UPDATE USING (auth.uid() = user_id OR is_admin(auth.uid()));
CREATE POLICY "Users delete own channel settings" ON public.channel_settings
  FOR DELETE USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Map Telegram chat owner: for now we map the bot to all users? No — we need ONE owner.
-- Add a global mapping: which user owns the Telegram bot
CREATE TABLE public.telegram_bot_owner (
  id INT PRIMARY KEY CHECK (id = 1),
  owner_user_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
INSERT INTO public.telegram_bot_owner (id, owner_user_id) VALUES (1, NULL);
ALTER TABLE public.telegram_bot_owner ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view bot owner" ON public.telegram_bot_owner
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can update bot owner" ON public.telegram_bot_owner
  FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Authenticated can claim ownership if empty" ON public.telegram_bot_owner
  FOR UPDATE TO authenticated USING (owner_user_id IS NULL OR owner_user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_channel_settings_updated_at BEFORE UPDATE ON public.channel_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
