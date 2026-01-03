-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user', 'rider', 'store');

-- Create function to update timestamps (needed before triggers)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email VARCHAR(255),
    name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create coupons table
CREATE TABLE public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(35) NOT NULL,
    discount INTEGER NOT NULL CHECK (discount >= 1 AND discount <= 100),
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Create riders table
CREATE TABLE public.riders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    available BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    time_zone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    notification_token TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;

-- Create rider_orders table
CREATE TABLE public.rider_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rider_id UUID REFERENCES public.riders(id) ON DELETE CASCADE NOT NULL,
    order_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'assigned',
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    picked_up_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.rider_orders ENABLE ROW LEVEL SECURITY;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_riders_updated_at BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_orders_updated_at BEFORE UPDATE ON public.rider_orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public profiles are viewable" ON public.profiles FOR SELECT USING (true);

-- RLS Policies for coupons
CREATE POLICY "Anyone can view enabled coupons" ON public.coupons FOR SELECT USING (enabled = true);
CREATE POLICY "Admins can view all coupons" ON public.coupons FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can create coupons" ON public.coupons FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update coupons" ON public.coupons FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete coupons" ON public.coupons FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for riders
CREATE POLICY "Riders can view their own profile" ON public.riders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Riders can update their own profile" ON public.riders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all riders" ON public.riders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Stores can view available riders" ON public.riders FOR SELECT USING (public.has_role(auth.uid(), 'store') AND available = true);

-- RLS Policies for rider_orders
CREATE POLICY "Riders can view their own orders" ON public.rider_orders FOR SELECT USING (EXISTS (SELECT 1 FROM public.riders r WHERE r.id = rider_id AND r.user_id = auth.uid()));
CREATE POLICY "Riders can update their own orders" ON public.rider_orders FOR UPDATE USING (EXISTS (SELECT 1 FROM public.riders r WHERE r.id = rider_id AND r.user_id = auth.uid()));
CREATE POLICY "Admins can manage all rider orders" ON public.rider_orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Stores can assign orders to riders" ON public.rider_orders FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'store') OR public.has_role(auth.uid(), 'admin'));

-- Rider functions
CREATE OR REPLACE FUNCTION public.rider_login(p_user_id UUID, p_time_zone VARCHAR DEFAULT 'UTC', p_notification_token TEXT DEFAULT NULL)
RETURNS TABLE (rider_id UUID, user_id UUID, username VARCHAR, available BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.riders r SET time_zone = p_time_zone, notification_token = COALESCE(p_notification_token, r.notification_token), updated_at = now() WHERE r.user_id = p_user_id;
    RETURN QUERY SELECT r.id, r.user_id, r.username, r.available FROM public.riders r WHERE r.user_id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_rider_location(p_rider_id UUID, p_latitude DOUBLE PRECISION, p_longitude DOUBLE PRECISION)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.riders SET latitude = p_latitude, longitude = p_longitude, updated_at = now() WHERE id = p_rider_id AND user_id = auth.uid();
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_order_to_rider(p_order_id UUID, p_rider_id UUID)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_assignment_id UUID;
BEGIN
    IF NOT (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'store')) THEN
        RAISE EXCEPTION 'Unauthorized: Only admins and stores can assign orders';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.riders WHERE id = p_rider_id AND available = true AND is_active = true) THEN
        RAISE EXCEPTION 'Rider not available or not found';
    END IF;
    INSERT INTO public.rider_orders (rider_id, order_id, status) VALUES (p_rider_id, p_order_id, 'assigned') RETURNING id INTO v_assignment_id;
    RETURN v_assignment_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.deliver_order(p_assignment_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.rider_orders SET status = 'delivered', delivered_at = now(), updated_at = now()
    WHERE id = p_assignment_id AND EXISTS (SELECT 1 FROM public.riders r WHERE r.id = rider_id AND r.user_id = auth.uid());
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.pickup_order(p_assignment_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    UPDATE public.rider_orders SET status = 'picked_up', picked_up_at = now(), updated_at = now()
    WHERE id = p_assignment_id AND EXISTS (SELECT 1 FROM public.riders r WHERE r.id = rider_id AND r.user_id = auth.uid());
    RETURN FOUND;
END;
$$;