import { LoginLink, RegisterLink } from '@kinde-oss/kinde-auth-nextjs/components';
import { CircleIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <CircleIcon className="h-12 w-12 text-orange-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your dashboard and manage your subscription
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-4">
        <LoginLink>
          <Button className="w-full flex justify-center py-2 px-4 rounded-full shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500">
            Sign in
          </Button>
        </LoginLink>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-gray-50 text-gray-500">
              New to our platform?
            </span>
          </div>
        </div>

        <RegisterLink>
          <Button
            variant="outline"
            className="w-full flex justify-center py-2 px-4 rounded-full shadow-sm text-sm font-medium"
          >
            Create an account
          </Button>
        </RegisterLink>
      </div>
    </div>
  );
}
