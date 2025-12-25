-- Drop the old check constraint
ALTER TABLE auth_codes DROP CONSTRAINT IF EXISTS auth_codes_code_type_check;

-- Add new check constraint with correct values
ALTER TABLE auth_codes ADD CONSTRAINT auth_codes_code_type_check 
CHECK (code_type = ANY (ARRAY['registration', '10min', '60min']));