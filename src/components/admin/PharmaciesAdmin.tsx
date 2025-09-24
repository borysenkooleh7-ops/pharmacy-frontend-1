import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { createPharmacy, updatePharmacy, deletePharmacy, fetchPharmacies } from '../../store/slices/pharmaciesSlice'
import { setLanguage } from '../../store/uiSlice'
import { Pharmacy } from '../../store/slices/types'
import { MONTENEGRO_CITIES } from '../../data/cities'
import { useTranslation } from '../../translations'
import Pagination from '../common/Pagination'
import Modal from '../common/Modal'
import FormField from '../common/FormField'

interface PharmaciesAdminProps {
  onMessage: (message: string) => void
}

export default function PharmaciesAdmin({ onMessage }: PharmaciesAdminProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { pharmacies, loading, pagination } = useAppSelector(state => state.adminPharmacies)
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)

  const [editingItem, setEditingItem] = useState<Pharmacy | null>(null)
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  useEffect(() => {
    dispatch(fetchPharmacies({ page: currentPage, limit: pageSize }))
  }, [dispatch, currentPage, pageSize])

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const handleCreateItem = async (data: any) => {
    try {
      await dispatch(createPharmacy(data)).unwrap()
      setShowCreateForm(false)
      onMessage(t('pharmacyCreated'))
    } catch (error: any) {
      onMessage(`${t('createFailed')}: ${error.message || t('unknownError')}`)
    }
  }

  const handleUpdateItem = async (data: any) => {
    try {
      await dispatch(updatePharmacy(data)).unwrap()
      setEditingItem(null)
      onMessage(t('pharmacyUpdated'))
    } catch (error: any) {
      onMessage(`${t('updateFailed')}: ${error.message || t('unknownError')}`)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await dispatch(deletePharmacy(id)).unwrap()
        onMessage(t('pharmacyDeleted'))
      } catch (error: any) {
        onMessage(`${t('deleteFailed')}: ${error.message || t('unknownError')}`)
      }
    }
  }

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)

    const latStr = formData.get('lat') as string
    const lngStr = formData.get('lng') as string
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)

    if (isNaN(lat) || isNaN(lng)) {
      onMessage(t('validCoordinates'))
      return
    }

    const data = {
      ...(editingItem && { id: editingItem.id }),
      city_id: parseInt(formData.get('city_id') as string),
      name_me: formData.get('name_me') as string,
      name_en: formData.get('name_en') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      website: formData.get('website') as string,
      lat,
      lng,
      is_24h: formData.get('is_24h') === 'on',
      open_sunday: formData.get('open_sunday') === 'on',
      hours_monfri: formData.get('hours_monfri') as string,
      hours_sat: formData.get('hours_sat') as string,
      hours_sun: formData.get('hours_sun') as string,
      active: formData.get('active') === 'on'
    }

    if (editingItem) {
      handleUpdateItem(data)
    } else {
      handleCreateItem(data)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold">Pharmacies ({pharmacies.length})</h3>
          <p className="text-xs text-gray-500">Manage pharmacy database entries</p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            ➕ {t('addPharmacy')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : (
        <>
          {pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems || 0}
              itemsPerPage={pageSize}
              hasNextPage={pagination.hasNextPage || false}
              hasPrevPage={pagination.hasPrevPage || false}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
            />
          )}

          <div className="bg-white shadow-md rounded-lg max-h-screen overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {language === 'me' ? pharmacy.name_me : pharmacy.name_en || pharmacy.name_me}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {pharmacy.city ? (language === 'me' ? pharmacy.city.name_me : pharmacy.city.name_en) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{pharmacy.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{pharmacy.phone || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        pharmacy.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pharmacy.active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setEditingItem(pharmacy)}
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(pharmacy.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {pagination && (
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems || 0}
              itemsPerPage={pageSize}
              hasNextPage={pagination.hasNextPage || false}
              hasPrevPage={pagination.hasPrevPage || false}
              onPageChange={setCurrentPage}
              onPageSizeChange={handlePageSizeChange}
              pageSize={pageSize}
            />
          )}
        </>
      )}

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateForm || editingItem !== null}
        onClose={() => {
          setShowCreateForm(false)
          setEditingItem(null)
        }}
        title={editingItem ? t('editPharmacy') : t('addPharmacy')}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('nameMe')}
              name="name_me"
              defaultValue={editingItem?.name_me || ''}
              required
            />
            <FormField
              label={t('nameEn')}
              name="name_en"
              defaultValue={editingItem?.name_en || ''}
            />
          </div>

          <FormField
            label={t('selectCity')}
            name="city_id"
            type="select"
            defaultValue={editingItem?.city_id?.toString() || ''}
            required
            options={[
              { value: '', label: t('selectCity') },
              ...MONTENEGRO_CITIES.map(city => ({
                value: city.id.toString(),
                label: language === 'me' ? city.name_me : city.name_en
              }))
            ]}
          />

          <FormField
            label={t('address')}
            name="address"
            defaultValue={editingItem?.address || ''}
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('phone')}
              name="phone"
              defaultValue={editingItem?.phone || ''}
            />
            <FormField
              label={t('website')}
              name="website"
              defaultValue={editingItem?.website || ''}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('latitude')}
              name="lat"
              type="number"
              step="any"
              defaultValue={editingItem?.lat?.toString() || ''}
              required
            />
            <FormField
              label={t('longitude')}
              name="lng"
              type="number"
              step="any"
              defaultValue={editingItem?.lng?.toString() || ''}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label={t('hoursMondayFriday')}
              name="hours_monfri"
              defaultValue={editingItem?.hours_monfri || ''}
              required
            />
            <FormField
              label={t('hoursSaturday')}
              name="hours_sat"
              defaultValue={editingItem?.hours_sat || ''}
              required
            />
            <FormField
              label={t('hoursSunday')}
              name="hours_sun"
              defaultValue={editingItem?.hours_sun || ''}
              required
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_24h"
                defaultChecked={editingItem?.is_24h || false}
                className="mr-2"
              />
              {t('is24h')}
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="open_sunday"
                defaultChecked={editingItem?.open_sunday || false}
                className="mr-2"
              />
              {t('openSunday')}
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                name="active"
                defaultChecked={editingItem?.active !== false}
                className="mr-2"
              />
              {t('active')}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setEditingItem(null)
              }}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {editingItem ? t('update') : t('create')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}