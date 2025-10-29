import React from 'react';

const SkeletonCard: React.FC = () => {
  return (
    <div className="rounded-lg p-4 bg-gray-800 border-2 border-gray-700 animate-pulse">
      <div className="flex items-start space-x-4">
        {/* Avatar skeleton */}
        <div className="w-16 h-16 rounded-full bg-gray-700"></div>

        <div className="flex-1 space-y-3">
          {/* Name skeleton */}
          <div className="h-5 bg-gray-700 rounded w-1/3"></div>

          {/* Description skeleton */}
          <div className="space-y-2">
            <div className="h-3 bg-gray-700 rounded w-full"></div>
            <div className="h-3 bg-gray-700 rounded w-5/6"></div>
          </div>

          {/* Button skeleton */}
          <div className="h-8 bg-gray-700 rounded w-24"></div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonCard;
