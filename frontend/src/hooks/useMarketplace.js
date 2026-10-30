import { useContext } from 'react';
import MarketplaceContext from '../context/MarketplaceContext';

export default function useMarketplace() {
  return useContext(MarketplaceContext);
}
