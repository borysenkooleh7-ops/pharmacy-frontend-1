import { useAppSelector } from '../hooks/redux'
import GoogleMap from './GoogleMap'
import { MapIcon, PharmacyIcon } from './ui/Icons'

export default function MapSection(): React.JSX.Element {
  const { language } = useAppSelector(state => state.ui)
  const { pharmacies, selectedCity } = useAppSelector(state => state.pharmacy)

  return (
        <GoogleMap />
  )
}