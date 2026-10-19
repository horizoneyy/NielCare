import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Skip Supabase checks if env vars are not set
  if (!rawUrl || !anonKey) {
    return supabaseResponse;
  }

  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Public routes — no auth required (including intro/landing page and static assets)
  const publicRoutes = ['/', '/login', '/register'];
  if (
    publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/')) ||
    pathname.startsWith('/videos/') ||
    pathname.endsWith('.mp4') ||
    pathname.endsWith('.webm')
  ) {
    if (user && (pathname === '/login' || pathname === '/register')) {
      // Ambil role langsung dari JWT metadata jika tersedia
      let role = user.user_metadata?.role;
      if (!role) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        role = profile?.role;
      }

      if (role) {
        const dashboardMap: Record<string, string> = {
          patient: '/patient/dashboard',
          doctor: '/doctor/dashboard',
          owner: '/owner/dashboard',
        };
        const url = request.nextUrl.clone();
        url.pathname = dashboardMap[role] || '/patient/dashboard';
        return NextResponse.redirect(url);
      }
    }
    return supabaseResponse;
  }

  // Protected routes — require auth
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Role-based access control — prioritaskan JWT metadata untuk kecepatan <1ms
  let role = user.user_metadata?.role;
  if (!role) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    role = profile?.role;
  }

  if (role) {
    if (pathname.startsWith('/patient') && role !== 'patient') {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}/dashboard`;
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/doctor') && role !== 'doctor') {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}/dashboard`;
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith('/owner') && role !== 'owner') {
      const url = request.nextUrl.clone();
      url.pathname = `/${role}/dashboard`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
