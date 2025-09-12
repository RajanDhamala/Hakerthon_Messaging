import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useKeyStore = create(
  persist(
    (set, get) => ({
      privateKey: null,
      publicKey: null,

      setKeys: ({ privateKey, publicKey }) => set({ privateKey, publicKey }),
     clearKeys: () => {
    set({ privateKey: null, publicKey: null });
    localStorage.removeItem('key-store');
},
    }),
    {
      name: 'key-store', 
    }
  )
);

export default useKeyStore;
