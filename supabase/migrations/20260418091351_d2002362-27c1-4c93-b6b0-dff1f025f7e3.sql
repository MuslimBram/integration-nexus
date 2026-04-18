
CREATE TABLE public.twilio_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  sms_from_number text,
  whatsapp_from_number text,
  webhook_secret text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.twilio_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own twilio config" ON public.twilio_config
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own twilio config" ON public.twilio_config
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own twilio config" ON public.twilio_config
  FOR UPDATE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users delete own twilio config" ON public.twilio_config
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE TRIGGER update_twilio_config_updated_at
BEFORE UPDATE ON public.twilio_config
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Map inbound numbers back to a user (for webhook routing without auth)
CREATE TABLE public.twilio_number_routing (
  phone_number text PRIMARY KEY,
  user_id uuid NOT NULL,
  channel text NOT NULL CHECK (channel IN ('sms','whatsapp')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.twilio_number_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own routing" ON public.twilio_number_routing
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
CREATE POLICY "Users insert own routing" ON public.twilio_number_routing
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own routing" ON public.twilio_number_routing
  FOR DELETE USING (auth.uid() = user_id OR public.is_admin(auth.uid()));
