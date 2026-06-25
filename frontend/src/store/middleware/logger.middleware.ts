import type { Middleware } from '@reduxjs/toolkit';

export const loggerMiddleware: Middleware = (store) => (next) => (action) => {
  if (import.meta.env.DEV) {
    const typedAction = action as { type?: string };

    console.group(
      `%c[Redux] ${typedAction.type ?? 'unknown'}`,
      'color: #6366f1; font-weight: 600;'
    );
    console.log('%cprev state', 'color: #94a3b8', store.getState());
    console.log('%caction', 'color: #3b82f6', action);

    const result = next(action);

    console.log('%cnext state', 'color: #10b981', store.getState());
    console.groupEnd();

    return result;
  }

  return next(action);
};
