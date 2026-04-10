import { withAuth } from '@kinde-oss/kinde-auth-nextjs/middleware';
import { NextRequest } from 'next/server';

export default withAuth(async function middleware(request: NextRequest) {
  // Kinde handles authentication checks automatically.
  // Add custom logic here if needed (e.g., role-based redirects).
});

export const config = {
  matcher: ['/dashboard/:path*'],
};
