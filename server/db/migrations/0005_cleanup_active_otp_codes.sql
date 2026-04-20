-- Cleanup script: remove active OTP codes created before OTP hashing with pepper rollout
DELETE FROM otp_codes
WHERE used_at IS NULL;
