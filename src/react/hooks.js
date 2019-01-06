import { useContext } from 'react';

import { PrimaryCacheContext } from './cache';

// Custom hook
export function useReadResource(resource, key) {
    const cache = useContext(PrimaryCacheContext);
    return resource.read(cache, key);
}
