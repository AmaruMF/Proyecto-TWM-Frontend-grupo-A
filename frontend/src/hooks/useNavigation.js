import { useSyncExternalStore } from 'react';

const subscribe = (callback) => {
  window.addEventListener('hashchange', callback);
  return () => window.removeEventListener('hashchange', callback);
};
const snapshot = () => window.location.hash.slice(1) || '/';

export function navigate(path) {
  window.location.hash = path;
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export default function useNavigation() {
  const path = useSyncExternalStore(subscribe, snapshot);
  const [view = '', id] = path.split('/').filter(Boolean);
  return { path, view, id, navigate };
}
