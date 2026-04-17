
CREATE POLICY "Block all client access" ON public.telegram_bot_state
  FOR ALL TO authenticated, anon USING (false) WITH CHECK (false);
