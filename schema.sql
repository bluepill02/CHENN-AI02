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

-- Create food_hunt_posts table
create table public.food_hunt_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- User information
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Food details
  restaurant_name text not null,
  dish_name text,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  price_range text, -- 'cheap', 'moderate', 'expensive'
  image_url text,
  
  -- Location
  pincode text not null,
  area text,
  
  likes integer default 0
);

-- Enable RLS for food hunt posts
alter table public.food_hunt_posts enable row level security;

-- RLS Policies
create policy "Food hunt posts viewable by everyone"
  on food_hunt_posts for select
  using ( true );

create policy "Authenticated users can create food hunt posts"
  on food_hunt_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own food hunt posts"
  on food_hunt_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own food hunt posts"
  on food_hunt_posts for delete
  using ( auth.uid() = user_id );

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

-- Create food_hunt_posts table
create table public.food_hunt_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- User information
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Food details
  restaurant_name text not null,
  dish_name text,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  price_range text, -- 'cheap', 'moderate', 'expensive'
  image_url text,
  
  -- Location
  pincode text not null,
  area text,
  
  likes integer default 0
);

-- Enable RLS for food hunt posts
alter table public.food_hunt_posts enable row level security;

-- RLS Policies
create policy "Food hunt posts viewable by everyone"
  on food_hunt_posts for select
  using ( true );

create policy "Authenticated users can create food hunt posts"
  on food_hunt_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own food hunt posts"
  on food_hunt_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own food hunt posts"
  on food_hunt_posts for delete
  using ( auth.uid() = user_id );

-- Indexes for performance
create index idx_food_hunt_pincode on food_hunt_posts(pincode);
create index idx_food_hunt_user on food_hunt_posts(user_id);
create index idx_food_hunt_created on food_hunt_posts(created_at desc);

-- Trigger to update updated_at on food hunt posts
create trigger food_hunt_posts_updated_at
  before update on public.food_hunt_posts
  for each row execute procedure handle_updated_at();

-- Create cinema_posts table for movie reviews and discussions
create table public.cinema_posts (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- User information
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Movie details
  movie_name text not null,
  theater_name text,
  rating integer check (rating >= 1 and rating <= 5),
  review text,
  
  -- Discussion type
  post_type text default 'review' check (post_type in ('review', 'discussion')),
  
  -- Location (optional, for finding theater buddies)
  pincode text,
  area text,
  
  likes integer default 0
);

-- Enable RLS for cinema posts
alter table public.cinema_posts enable row level security;

-- RLS Policies
create policy "Cinema posts viewable by everyone"
  on cinema_posts for select
  using ( true );

create policy "Authenticated users can create cinema posts"
  on cinema_posts for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own cinema posts"
  on cinema_posts for update
  using ( auth.uid() = user_id );

create policy "Users can delete own cinema posts"
  on cinema_posts for delete
  using ( auth.uid() = user_id );

-- Indexes for performance
create index idx_cinema_posts_movie on cinema_posts(movie_name);
create index idx_cinema_posts_type on cinema_posts(post_type);
create index idx_cinema_posts_created on cinema_posts(created_at desc);

-- Trigger to update updated_at on cinema posts
create trigger cinema_posts_updated_at
  before update on public.cinema_posts
  for each row execute procedure handle_updated_at();

-- Create kaapi_jobs table for part-time job postings
create table public.kaapi_jobs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  job_title text not null,
  description text not null,
  location text,
  salary_range text,
  contact_info text,
  
  likes integer default 0
);

-- Enable RLS for kaapi jobs
alter table public.kaapi_jobs enable row level security;

-- RLS Policies
create policy "Kaapi jobs viewable by everyone"
  on kaapi_jobs for select
  using ( true );

create policy "Authenticated users can create kaapi jobs"
  on kaapi_jobs for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own kaapi jobs"
  on kaapi_jobs for update
  using ( auth.uid() = user_id );

create policy "Users can delete own kaapi jobs"
  on kaapi_jobs for delete
  using ( auth.uid() = user_id );

-- Indexes for performance
create index idx_kaapi_jobs_created on kaapi_jobs(created_at desc);

-- Trigger to update updated_at on kaapi jobs
create trigger kaapi_jobs_updated_at
  before update on public.kaapi_jobs
  for each row execute procedure handle_updated_at();

-- Create business_profiles table for service providers
create table public.business_profiles (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  business_name text not null,
  category text not null,
  description text,
  location text not null,
  contact_number text not null,
  is_verified boolean default false,
  
  -- Optional fields
  image_url text,
  opening_hours text,
  price_range text
);

-- Enable RLS for business profiles
alter table public.business_profiles enable row level security;

-- RLS Policies
create policy "Business profiles viewable by everyone"
  on business_profiles for select
  using ( true );

create policy "Authenticated users can create business profiles"
  on business_profiles for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own business profile"
  on business_profiles for update
  using ( auth.uid() = user_id );

create policy "Users can delete own business profile"
  on business_profiles for delete
  using ( auth.uid() = user_id );

-- Indexes for performance
create index idx_business_profiles_category on business_profiles(category);
create index idx_business_profiles_location on business_profiles(location);

-- Trigger to update updated_at on business profiles
create trigger business_profiles_updated_at
  before update on public.business_profiles
  for each row execute procedure handle_updated_at();

-- Create service_reviews table for trust and reliability
create table public.service_reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  business_id uuid references public.business_profiles(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  rating integer check (rating >= 1 and rating <= 5) not null,
  review_text text,
  is_verified_visit boolean default false
);

-- Enable RLS
alter table public.service_reviews enable row level security;

-- Policies
create policy "Reviews viewable by everyone"
  on service_reviews for select
  using ( true );

create policy "Authenticated users can create reviews"
  on service_reviews for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own reviews"
  on service_reviews for update
  using ( auth.uid() = user_id );

create policy "Users can delete own reviews"
  on service_reviews for delete
  using ( auth.uid() = user_id );

-- Indexes
create index idx_service_reviews_business on service_reviews(business_id);

-- Function to calculate trust score and update business profile
create or replace function update_business_stats()
returns trigger as $$
begin
  update public.business_profiles
  set 
    rating = (select avg(rating) from public.service_reviews where business_id = new.business_id),
    review_count = (select count(*) from public.service_reviews where business_id = new.business_id)
  where id = new.business_id;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to update stats on new review
create trigger on_review_added
  after insert or update or delete on public.service_reviews
  for each row execute procedure update_business_stats();

-- Add rating columns to business_profiles if they don't exist (idempotent-ish via alter)
do $$
begin
  if not exists (select 1 from information_schema.columns where table_name = 'business_profiles' and column_name = 'rating') then
    alter table public.business_profiles add column rating numeric(3,2) default 0;
    alter table public.business_profiles add column review_count integer default 0;
  end if;
end $$;