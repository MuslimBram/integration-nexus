
SELECT cron.schedule(
  'poll-telegram-updates',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://mtjrbqhbpkpgbgctpmeb.supabase.co/functions/v1/telegram-poll',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im10anJicWhicGtwZ2JnY3RwbWViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNjk4OTQsImV4cCI6MjA5MTY0NTg5NH0.Mkd6meUXiq6sPFMhcm6qajaPtX5mmA23x3ItFu1EAtM"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
