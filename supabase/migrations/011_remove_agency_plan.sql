-- Migrate any agency plans to pro
UPDATE hotels SET plan = 'pro' WHERE plan = 'agency';
