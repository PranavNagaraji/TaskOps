'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EmployeeAccessProvider({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEmployee, setIsEmployee] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkEmployeeStatus = async () => {
      if (status === 'loading' || !session) return;

      try {
        // First verify the user is an employee
        if (session.user.role !== 'employee') {
          router.push('/');
          return;
        }

        // Then check if they exist in the employees table
        const response = await fetch(`/api/employees/user/${session.user.id}`);

        if (!response.ok) {
          // If we get a 404, the employee doesn't exist
          if (response.status === 404) {
            setIsEmployee(false);
            return;
          }
          // For other errors, throw an exception
          throw new Error('Failed to verify employee status');
        }

        const data = await response.json();
        if (!data.exists) {
          // Employee not found in the employees table
          setIsEmployee(false);
        } else {
          // Employee exists and is verified
          setIsEmployee(true);
        }
      } catch (error) {
        console.error('Error checking employee status:', error);
        setIsEmployee(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkEmployeeStatus();
  }, [session, status, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying access...</span>
      </div>
    );
  }

  if (!isEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h2>
          <p className="text-gray-700 mb-6">
            Your account does not have the necessary permissions to access this area.
            Please contact your administrator if you believe this is an error.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
