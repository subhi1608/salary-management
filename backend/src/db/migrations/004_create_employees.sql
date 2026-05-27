CREATE TABLE IF NOT EXISTS employees (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  full_name        VARCHAR(255) GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email            VARCHAR(255) UNIQUE NOT NULL,
  job_title        VARCHAR(150) NOT NULL,
  department_id    INTEGER REFERENCES departments(id),
  country          VARCHAR(100) NOT NULL,
  salary           NUMERIC(12, 2) NOT NULL,
  employment_type  VARCHAR(20) NOT NULL CHECK (employment_type IN ('full_time', 'part_time', 'contractor')),
  hire_date        DATE NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  termination_date DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employees_country       ON employees(country);
CREATE INDEX IF NOT EXISTS idx_employees_job_title     ON employees(job_title);
CREATE INDEX IF NOT EXISTS idx_employees_country_title ON employees(country, job_title);
CREATE INDEX IF NOT EXISTS idx_employees_is_active     ON employees(is_active);
CREATE INDEX IF NOT EXISTS idx_employees_full_name     ON employees USING gin(full_name gin_trgm_ops);
