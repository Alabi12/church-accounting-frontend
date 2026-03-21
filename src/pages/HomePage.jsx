import React from 'react';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <div className="bg-white">
      <div className="relative overflow-hidden">
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Church Accounting System
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Manage your church finances with ease. Track tithes, offerings, expenses, and generate reports all in one place.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                to="/register"
                className="rounded-md bg-primary-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Sign in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.name} className="pt-6">
                <div className="flow-root rounded-lg bg-gray-50 px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center rounded-xl bg-primary-600 p-3 shadow-lg">
                        <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-semibold leading-8 tracking-tight text-gray-900">
                      {feature.name}
                    </h3>
                    <p className="mt-5 text-base leading-7 text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

const features = [
  {
    name: 'Income Management',
    description: 'Track tithes, offerings, and all church income sources with ease.',
    icon: CurrencyDollarIcon,
  },
  {
    name: 'Expense Tracking',
    description: 'Monitor and categorize all church expenses efficiently.',
    icon: BanknotesIcon,
  },
  {
    name: 'Financial Reports',
    description: 'Generate detailed financial reports including balance sheets and income statements.',
    icon: ChartBarIcon,
  },
  {
    name: 'Budget Management',
    description: 'Create and manage budgets for different ministries and departments.',
    icon: DocumentTextIcon,
  },
  {
    name: 'Member Giving',
    description: 'Track individual member giving patterns and generate statements.',
    icon: UserGroupIcon,
  },
  {
    name: 'Payroll Processing',
    description: 'Manage staff salaries, taxes, and generate pay slips.',
    icon: Cog6ToothIcon,
  },
];