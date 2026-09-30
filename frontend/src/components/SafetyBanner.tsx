import React from 'react';
import { ShieldCheck, MapPin } from 'lucide-react';

export default function SafetyBanner() {
  return (
    <div className="bg-indigo-50 border-l-4 border-indigo-600 p-4 rounded-r-lg shadow-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <ShieldCheck className="h-5 w-5 text-indigo-600" aria-hidden="true" />
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-indigo-900">
            Campus Safety First
          </p>
          <p className="mt-1 text-xs text-indigo-700">
            Always meet in well-lit, public campus areas (e.g., University Library, Student Union, or Campus Dining Hall) and verify the item in person before paying. CampusSwap never requests or processes payments online.
          </p>
        </div>
      </div>
    </div>
  );
}
