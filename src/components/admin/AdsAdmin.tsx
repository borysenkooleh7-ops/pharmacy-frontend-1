import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { createAd, updateAd, deleteAd, fetchAds } from '../../store/slices/adsSlice'
import { Ad } from '../../store/slices/types'
import { useTranslation } from '../../translations'
import Pagination from '../common/Pagination'
import Modal from '../common/Modal'
import FormField from '../common/FormField'

interface AdsAdminProps {
  onMessage: (message: string) => void
}

export default function AdsAdmin({ onMessage }: AdsAdminProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { ads, loading, pagination } = useAppSelector(state => state.adminAds)
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)

  const [editingItem, setEditingItem] = useState<Ad | null>(null)
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  useEffect(() => {
    dispatch(fetchAds({ page: currentPage, limit: pageSize }))
  }, [dispatch, currentPage, pageSize])

  const handleCreateItem = async (data: any) => {
    try {
      await dispatch(createAd(data)).unwrap()
      setShowCreateForm(false)
      onMessage(t('advertisementCreated'))
      // Redux slice automatically adds the new ad to state, no need to refetch
    } catch (error: any) {
      onMessage(`${t('failedToCreateAdvertisement')}: ${error.message}`)
    }
  }

  const handleUpdateItem = async (data: any) => {
    try {
      await dispatch(updateAd(data)).unwrap()
      setEditingItem(null)
      onMessage(t('advertisementUpdated'))
      // Redux slice automatically updates the ad in state for immediate UI update
    } catch (error: any) {
      onMessage(`${t('failedToUpdateAdvertisement')}: ${error.message}`)
    }
  }

  const handleDeleteItem = async (id: number) => {
    if (window.confirm(t('confirmDeleteAdvertisement'))) {
      try {
        await dispatch(deleteAd(id)).unwrap()
        // Redux slice automatically removes the ad from state and updates pagination
        // If current page becomes empty, go to previous page
        if (ads.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1)
        }
        onMessage(t('advertisementDeleted'))
      } catch (error: any) {
        onMessage(`${t('failedToDeleteAdvertisement')}: ${error.message}`)
      }
    }
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  const closeModal = () => {
    setShowCreateForm(false)
    setEditingItem(null)
  }

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const isEditing = !!editingItem

    // Validate weight range (0-10 to match backend constraint)
    const weight = parseInt(formData.get('weight') as string) || 1
    if (weight < 0 || weight > 10) {
      onMessage(t('weightMustBeBetween'))
      return
    }

    const data = {
      ...(isEditing && { id: editingItem.id }),
      name_me: formData.get('name_me') as string,
      name_en: formData.get('name_en') as string,
      image_url: formData.get('image_url') as string,
      target_url: formData.get('target_url') as string,
      weight,
      start_date: formData.get('start_date') as string,
      end_date: formData.get('end_date') as string,
      active: formData.get('active') === 'on'
    }

    if (isEditing) {
      handleUpdateItem(data)
    } else {
      handleCreateItem(data)
    }
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('advertisements')} ({ads.length})</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          ➕ {t('addAdvertisement')}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      ) : ads.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {t('noAdvertisementsFound')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('name')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('targetUrl')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('weight')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('stats')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ads.map((ad: Ad) => (
                <tr key={ad.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{language === 'me' ? ad.name_me : (ad.name_en || ad.name_me)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">
                      <a href={ad.target_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {ad.target_url}
                      </a>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{ad.weight}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      ad.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {ad.active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{t('clicks')}: {ad.click_count}</div>
                    <div className="text-sm text-gray-600">{t('views')}: {ad.impression_count}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(ad)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(ad.id)}
                        className="text-red-600 hover:text-red-900 text-sm"
                      >
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && ads.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          hasNextPage={pagination.hasNextPage}
          hasPrevPage={pagination.hasPrevPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          pageSize={pageSize}
        />
      )}

      {/* Modal for Create/Edit */}
      <Modal
        isOpen={showCreateForm || !!editingItem}
        onClose={closeModal}
        title={editingItem ? t('editAdvertisement') : t('createAdvertisement')}
        maxWidth="lg"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label={t('nameMe')}
              name="name_me"
              type="text"
              defaultValue={editingItem?.name_me || ''}
              required
              placeholder={t('pharmacyNameMePlaceholder')}
            />

            <FormField
              label={t('nameEn')}
              name="name_en"
              type="text"
              defaultValue={editingItem?.name_en || ''}
              placeholder={t('pharmacyNameEnPlaceholder')}
            />

            <FormField
              label={t('weightPriority')}
              name="weight"
              type="number"
              defaultValue={editingItem?.weight?.toString() || '1'}
              min={0}
              max={10}
              placeholder="1"
              helpText={t('weightHelp')}
            />

            <div className="md:col-span-2">
              <FormField
                label={t('imageUrl')}
                name="image_url"
                type="url"
                defaultValue={editingItem?.image_url || ''}
                required
                placeholder="https://example.com/image.jpg"
                helpText={t('imageUrlHelp')}
              />
            </div>

            <div className="md:col-span-2">
              <FormField
                label={t('targetUrl')}
                name="target_url"
                type="url"
                defaultValue={editingItem?.target_url || ''}
                required
                placeholder="https://example.com"
                helpText={t('targetUrlHelp')}
              />
            </div>

            <FormField
              label={t('startDate')}
              name="start_date"
              type="date"
              defaultValue={editingItem?.start_date?.split('T')[0] || ''}
              helpText={t('startDateHelp')}
            />

            <FormField
              label={t('endDate')}
              name="end_date"
              type="date"
              defaultValue={editingItem?.end_date?.split('T')[0] || ''}
              helpText={t('endDateHelp')}
            />
          </div>

          <div className="mt-6">
            <FormField
              label={t('active')}
              name="active"
              type="checkbox"
              defaultValue={editingItem?.active ?? true}
            />
          </div>

          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {editingItem ? t('updateAdvertisement') : t('createAdvertisement')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}