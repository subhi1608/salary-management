CREATE TABLE IF NOT EXISTS departments (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

INSERT INTO departments (name) VALUES
  ('Engineering'),
  ('Sales'),
  ('HR'),
  ('Finance'),
  ('Marketing'),
  ('Operations'),
  ('Legal'),
  ('Product')
ON CONFLICT (name) DO NOTHING;
