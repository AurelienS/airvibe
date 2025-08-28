'use client';

import React, { createContext, useContext } from 'react';

export type CurrentUser = {
  id: string | null;
  email: string | null;
};

const Ctx = createContext<CurrentUser>({ id: null, email: null });

export function CurrentUserProvider({ value, children }: { value: CurrentUser; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentUser(): CurrentUser {
  return useContext(Ctx);
}


