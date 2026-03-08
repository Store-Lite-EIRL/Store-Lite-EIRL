'use client';

import React from 'react';

export const Divider = ({ className, ...props }: React.HTMLAttributes<HTMLElement>) => {
  return <md-divider className={className} {...props} />;
};
