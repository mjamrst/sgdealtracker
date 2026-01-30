-- SG Deal Tracker Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'founder');
CREATE TYPE member_role AS ENUM ('founder', 'team');
CREATE TYPE prospect_function AS ENUM ('marketing', 'insights', 'partnerships', 'other');
CREATE TYPE prospect_stage AS ENUM (
  'intro_made',
  'responded_yes',
  'responded_no',
  'meeting_scheduled',
  'demo_completed_yes',
  'demo_completed_no',
  'proposal_sent',
  'closed_won',
  'closed_lost'
);
CREATE TYPE material_type AS ENUM ('pitch_deck', 'trend_report', 'other');
CREATE TYPE activity_type AS ENUM (
  'stage_change',
  'note_added',
  'material_uploaded',
  'prospect_created',
  'prospect_updated'
);

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Startups table
CREATE TABLE startups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Startup members junction table
CREATE TABLE startup_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role member_role DEFAULT 'founder',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(startup_id, user_id)
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  pricing TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prospects table
CREATE TABLE prospects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  industry TEXT,
  function prospect_function DEFAULT 'other',
  estimated_value DECIMAL(12, 2),
  stage prospect_stage DEFAULT 'intro_made',
  notes TEXT,
  next_action TEXT,
  next_action_due DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type material_type DEFAULT 'other',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Material versions table
CREATE TABLE material_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log table
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  prospect_id UUID REFERENCES prospects(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action_type activity_type NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invites table
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  startup_id UUID NOT NULL REFERENCES startups(id) ON DELETE CASCADE,
  role member_role DEFAULT 'founder',
  token TEXT NOT NULL DEFAULT uuid_generate_v4()::text,
  invited_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(token)
);

-- Indexes for performance
CREATE INDEX idx_startup_members_user ON startup_members(user_id);
CREATE INDEX idx_startup_members_startup ON startup_members(startup_id);
CREATE INDEX idx_prospects_startup ON prospects(startup_id);
CREATE INDEX idx_prospects_stage ON prospects(stage);
CREATE INDEX idx_products_startup ON products(startup_id);
CREATE INDEX idx_materials_startup ON materials(startup_id);
CREATE INDEX idx_material_versions_material ON material_versions(material_id);
CREATE INDEX idx_activity_log_startup ON activity_log(startup_id);
CREATE INDEX idx_activity_log_prospect ON activity_log(prospect_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);
CREATE INDEX idx_invites_token ON invites(token);

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'founder')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at on prospects
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for prospects updated_at
CREATE TRIGGER prospects_updated_at
  BEFORE UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to log activity on prospect stage change
CREATE OR REPLACE FUNCTION log_prospect_stage_change()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
BEGIN
  IF OLD.stage IS DISTINCT FROM NEW.stage THEN
    SELECT full_name INTO user_name FROM profiles WHERE id = auth.uid();

    INSERT INTO activity_log (startup_id, prospect_id, user_id, action_type, description, metadata)
    VALUES (
      NEW.startup_id,
      NEW.id,
      auth.uid(),
      'stage_change',
      COALESCE(user_name, 'Someone') || ' moved ' || NEW.company_name || ' to ' || REPLACE(NEW.stage::text, '_', ' '),
      jsonb_build_object('old_stage', OLD.stage, 'new_stage', NEW.stage)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for logging stage changes
CREATE TRIGGER on_prospect_stage_change
  AFTER UPDATE ON prospects
  FOR EACH ROW EXECUTE FUNCTION log_prospect_stage_change();

-- Row Level Security Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospects ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user has access to startup
CREATE OR REPLACE FUNCTION has_startup_access(startup_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN is_admin() OR EXISTS (
    SELECT 1 FROM startup_members WHERE user_id = auth.uid() AND startup_id = startup_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (is_admin());

-- Startups policies
CREATE POLICY "Users can view startups they belong to" ON startups
  FOR SELECT USING (has_startup_access(id));
CREATE POLICY "Admins can create startups" ON startups
  FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admins can update startups" ON startups
  FOR UPDATE USING (is_admin());
CREATE POLICY "Admins can delete startups" ON startups
  FOR DELETE USING (is_admin());

-- Startup members policies
CREATE POLICY "Users can view members of their startups" ON startup_members
  FOR SELECT USING (has_startup_access(startup_id));
CREATE POLICY "Admins can manage startup members" ON startup_members
  FOR ALL USING (is_admin());

-- Products policies
CREATE POLICY "Users can view products of their startups" ON products
  FOR SELECT USING (has_startup_access(startup_id));
CREATE POLICY "Users can manage products of their startups" ON products
  FOR ALL USING (has_startup_access(startup_id));

-- Prospects policies
CREATE POLICY "Users can view prospects of their startups" ON prospects
  FOR SELECT USING (has_startup_access(startup_id));
CREATE POLICY "Users can manage prospects of their startups" ON prospects
  FOR ALL USING (has_startup_access(startup_id));

-- Materials policies
CREATE POLICY "Users can view materials of their startups" ON materials
  FOR SELECT USING (has_startup_access(startup_id));
CREATE POLICY "Users can manage materials of their startups" ON materials
  FOR ALL USING (has_startup_access(startup_id));

-- Material versions policies
CREATE POLICY "Users can view material versions" ON material_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM materials m WHERE m.id = material_id AND has_startup_access(m.startup_id)
    )
  );
CREATE POLICY "Users can create material versions" ON material_versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM materials m WHERE m.id = material_id AND has_startup_access(m.startup_id)
    )
  );

-- Activity log policies
CREATE POLICY "Users can view activity of their startups" ON activity_log
  FOR SELECT USING (has_startup_access(startup_id));
CREATE POLICY "Users can create activity for their startups" ON activity_log
  FOR INSERT WITH CHECK (has_startup_access(startup_id));

-- Invites policies
CREATE POLICY "Admins can manage invites" ON invites
  FOR ALL USING (is_admin());
CREATE POLICY "Anyone can view invite by token" ON invites
  FOR SELECT USING (true);
CREATE POLICY "Anyone can update invite when accepting" ON invites
  FOR UPDATE USING (true);

-- Storage bucket for materials
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Users can upload materials" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'materials' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view materials they have access to" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'materials' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete their uploaded materials" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'materials' AND
    auth.role() = 'authenticated'
  );

-- Seed data: Create Social Glass startup
INSERT INTO startups (id, name, description, category)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Social Glass',
  'A Gen Z insights tool that helps brands understand and connect with younger audiences through social listening and trend analysis.',
  'Consumer Insights'
);

-- Seed data: Create sample products for Social Glass
INSERT INTO products (startup_id, name, description, pricing)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Monthly Trends Newsletter', 'Curated monthly report on emerging Gen Z trends and behaviors', '$X/mo'),
  ('a0000000-0000-0000-0000-000000000001', 'Full Social Glass Access', 'Complete platform access with real-time insights and analytics', '$X/yr'),
  ('a0000000-0000-0000-0000-000000000001', 'Quarterly Trends Workshop', 'Interactive workshop for your team on quarterly trend insights', '$X');
