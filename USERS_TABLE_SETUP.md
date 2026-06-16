# Users Table Setup for Supabase

Run this SQL in your Supabase SQL Editor to create the users table and link it to clients:

```sql
-- Create client_users table
CREATE TABLE IF NOT EXISTS public.client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create vendor_users table
CREATE TABLE IF NOT EXISTS public.vendor_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  last_active TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_client_users_client_id ON public.client_users(client_id);
CREATE INDEX idx_client_users_status ON public.client_users(status);
CREATE INDEX idx_vendor_users_vendor_id ON public.vendor_users(vendor_id);
CREATE INDEX idx_vendor_users_status ON public.vendor_users(status);

-- Enable RLS
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all operations on client_users" ON public.client_users AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all operations on vendor_users" ON public.vendor_users AS PERMISSIVE FOR ALL USING (true) WITH CHECK (true);

-- Create auto-update trigger for timestamps
DROP TRIGGER IF EXISTS update_client_users_updated_at ON public.client_users;
CREATE TRIGGER update_client_users_updated_at
  BEFORE UPDATE ON public.client_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_users_updated_at ON public.vendor_users;
CREATE TRIGGER update_vendor_users_updated_at
  BEFORE UPDATE ON public.vendor_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
```
