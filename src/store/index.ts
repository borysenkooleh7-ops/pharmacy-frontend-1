import { configureStore } from '@reduxjs/toolkit'
import pharmacySlice from './pharmacySlice'
import uiSlice from './uiSlice'
import adSlice from './adSlice'
import pharmaciesSlice from './slices/pharmaciesSlice'
import medicinesSlice from './slices/medicinesSlice'
import adsSlice from './slices/adsSlice'
import submissionsSlice from './slices/submissionsSlice'
import onlineDataSlice from './slices/onlineDataSlice'

export const store = configureStore({
  reducer: {
    pharmacy: pharmacySlice,
    ui: uiSlice,
    ads: adSlice, // Public ads for display
    adminPharmacies: pharmaciesSlice,
    adminMedicines: medicinesSlice,
    adminAds: adsSlice, // Admin ads management
    adminSubmissions: submissionsSlice,
    onlineData: onlineDataSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

// TypeScript types
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch