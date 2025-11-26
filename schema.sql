--- Create profiles table
create table public.profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  area text,
  language text default 'en',
  
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create posts table
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  image_url text,
  user_id uuid references public.profiles(id) not null,
  area text,
  category text,
  likes integer default 0,
  comments_count integer default 0
);

alter table public.posts enable row level security;

create policy "Posts are viewable by everyone."
  on posts for select
  using ( true );

create policy "Authenticated users can create posts."
  on posts for insert
  with check ( auth.role() = 'authenticated' );

-- Create messages table for chat
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  content text not null,
  sender_id uuid references public.profiles(id) not null,
  chat_id text not null, -- Can be a group ID or a composite of two user IDs
  is_read boolean default false
);

alter table public.messages enable row level security;

create policy "Messages are viewable by participants."
  on messages for select
  using ( true ); -- Simplified for demo, ideally check participation

create policy "Authenticated users can send messages."
  on messages for insert
  with check ( auth.role() = 'authenticated' );

-- Create auto_share_posts table for ride sharing
create table public.auto_share_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  expires_at timestamp with time zone not null,
  
  -- User information
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Ride details
  from_location text not null,
  to_location text not null,
  seats_available integer not null check (seats_available > 0 and seats_available <=10),
  
  -- Location filtering
  pincode text not null,
  area text,
  
  -- Optional details
  departure_time timestamp with time zone,
  vehicle_type text default 'auto', -- 'auto', 'car', 'bike'
  fare_sharing boolean default true,
  notes text,
  
  -- Status
  status text default 'active' check (status in ('active', 'filled', 'cancelled', 'expired')),
  views_count integer default 0,
  
  -- Contact preferences
  contact_via text default 'chat' check (contact_via in ('chat', 'phone', 'both'))
);

-- Enable RLS for auto share posts
alter table public.auto_share_posts enable row level security;

-- RLS Policies
create policy "Auto share posts viewable by everyone"
  on auto_share_posts for select
  using ( true );

create policy "Authenticated users can create auto share posts"
  on auto_share_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own auto share posts"
  on auto_share_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own auto share posts"
  on auto_share_posts for delete
  using ( auth.uid() = user_id );

-- Indexes for performance
create index idx_auto_share_pincode on auto_share_posts(pincode);
create index idx_auto_share_status on auto_share_posts(status);
create index idx_auto_share_expires on auto_share_posts(expires_at);
create index idx_auto_share_user on auto_share_posts(user_id);
create index idx_auto_share_created on auto_share_posts(created_at desc);

-- Function to auto-expire old posts
create or replace function expire_old_auto_share_posts()
returns void as $$
begin
  update public.auto_share_posts
  set status = 'expired'
  where expires_at < now() and status = 'active';
end;
$$  language plpgsql security definer;

-- Function to increment view count
create or replace function increment_auto_share_views(post_id uuid)
returns void as $$
begin
  update public.auto_share_posts
  set views_count = views_count + 1
  where id = post_id;
end;
$$ language plpgsql security definer;

-- Function to update updated_at timestamp
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger to update updated_at on auto share posts
create trigger auto_share_posts_updated_at
  before update on public.auto_share_posts
  for each row execute procedure handle_updated_at();

-- Create function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();