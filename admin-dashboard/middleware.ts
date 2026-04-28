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
  } else {
    // For production domains like demo.yoursaas.com
    const parts = hostname.split('.');
    
    // Check if the host ends with one of our known parent domains
    const isMainDomain = allowedDomains.some(d => hostname === d);
    const isNgrok = hostname.includes('ngrok');
    
    // If it has at least 3 parts (e.g. demo.yoursaas.com) and is NOT the main domain and NOT ngrok
    if (parts.length >= 3 && !isMainDomain && !isNgrok) {
      // The subdomain is the first part
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
