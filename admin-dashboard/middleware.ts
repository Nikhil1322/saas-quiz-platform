import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (proxied images)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|uploads|.*\\.svg|.*\\.png|.*\\.jpg).*)',
  ],
};

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // Get hostname of request (e.g. demo.vercel.app, demo.localhost:3000)
  const hostname = req.headers.get('host') || '';

  // Define allowed parent domains (add yours here)
  const allowedDomains = ['localhost:3000', 'lvh.me:3000', 'ngrok-free.app', 'yoursaas.com', 'vercel.app'];

  // Extract the subdomain
  let subdomain = '';
  
  // Local testing with subdomains (e.g. brand.localhost:3000 or brand.lvh.me:3000)
  if (hostname.includes('.localhost:3000')) {
    subdomain = hostname.replace('.localhost:3000', '');
  } else if (hostname.includes('.lvh.me:3000')) {
    subdomain = hostname.replace('.lvh.me:3000', '');
  } else if (hostname.endsWith('.vercel.app')) {
    // For Vercel, the main domain is [project].vercel.app
    // We only want a subdomain if it's [tenant].[project].vercel.app (4 parts)
    const parts = hostname.split('.');
    if (parts.length >= 4) {
      subdomain = parts[0];
    }
  } else {
    // For custom production domains like tenant.yoursaas.com
    const parts = hostname.split('.');
    const isMainDomain = allowedDomains.some(d => hostname === d);
    
    if (parts.length >= 3 && !isMainDomain && !hostname.includes('ngrok')) {
      subdomain = parts[0];
    }
  }

  // If there's no subdomain or it's "www" or "app", let it pass to the normal SaaS dashboard
  if (!subdomain || subdomain === 'www' || subdomain === 'app') {
    return NextResponse.next();
  }

  // Prevent rewriting if the user is explicitly trying to visit the /site path
  if (url.pathname.startsWith('/site')) {
    return NextResponse.next();
  }

  // Rewrite to the tenant-specific dynamic route
  // e.g. srishti.yoursaas.com/ -> rewrites to /site/srishti/
  // e.g. srishti.yoursaas.com/quiz/1 -> rewrites to /site/srishti/quiz/1
  return NextResponse.rewrite(new URL(`/site/${subdomain}${url.pathname}`, req.url));
}
