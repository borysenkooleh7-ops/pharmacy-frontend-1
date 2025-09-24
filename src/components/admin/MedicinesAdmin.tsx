import { useState, useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { createMedicine, updateMedicine, deleteMedicine, fetchMedicines } from '../../store/slices/medicinesSlice'
import { Medicine } from '../../store/slices/types'
import { useTranslation } from '../../translations'
import Pagination from '../common/Pagination'
import Modal from '../common/Modal'
import FormField from '../common/FormField'

interface MedicinesAdminProps {
  onMessage: (message: string) => void
}

export default function MedicinesAdmin({ onMessage }: MedicinesAdminProps): React.JSX.Element {
  const dispatch = useAppDispatch()
  const { medicines, loading, pagination } = useAppSelector(state => state.adminMedicines)
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)

  const [editingItem, setEditingItem] = useState<Medicine | null>(null)
  const [showCreateForm, setShowCreateForm] = useState<boolean>(false)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(20)

  useEffect(() => {
    dispatch(fetchMedicines({ page: currentPage, limit: pageSize }))
  }, [dispatch, currentPage, pageSize])

  const handleCreateItem = async (data: any) => {
    await dispatch(createMedicine(data))
    setShowCreateForm(false)
    // Refresh current page to show new item
    dispatch(fetchMedicines({ page: currentPage, limit: pageSize }))
    onMessage(t('medicineCreated'))
  }

  const handleUpdateItem = async (data: any) => {
    await dispatch(updateMedicine(data))
    setEditingItem(null)
    onMessage(t('medicineUpdated'))
  }

  const handleDeleteItem = async (id: number) => {
    if (window.confirm(t('confirmDeleteMedicine'))) {
      await dispatch(deleteMedicine(id))
      // If current page becomes empty, go to previous page
      if (medicines.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1)
      } else {
        dispatch(fetchMedicines({ page: currentPage, limit: pageSize }))
      }
      onMessage(t('medicineDeleted'))
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

    const data = {
      ...(isEditing && { id: editingItem.id }),
      name_me: formData.get('name_me') as string,
      name_en: formData.get('name_en') as string,
      description: formData.get('description') as string,
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
        <h3 className="text-lg font-semibold">{t('medicines')} ({medicines.length})</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
        >
          ➕ {t('addMedicine')}
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      ) : medicines.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          {t('noMedicinesFound')}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nameMe')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('nameEn')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('description')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {medicines.map((medicine: Medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{medicine.name_me}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{medicine.name_en || '-'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{medicine.description || '-'}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      medicine.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {medicine.active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingItem(medicine)}
                        className="text-blue-600 hover:text-blue-900 text-sm"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => handleDeleteItem(medicine.id)}
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
      {!loading && medicines.length > 0 && (
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
        title={editingItem ? t('editMedicine') : t('createMedicine')}
        maxWidth="md"
      >
        <form onSubmit={handleFormSubmit}>
          <div className="space-y-4">
            <FormField
              label={t('nameMe')}
              name="name_me"
              type="text"
              defaultValue={editingItem?.name_me || ''}
              required
              placeholder="Lijek..."
              helpText={t('enterMedicineNameMe')}
            />

            <FormField
              label={t('nameEn')}
              name="name_en"
              type="text"
              defaultValue={editingItem?.name_en || ''}
              placeholder="Medicine..."
              helpText={t('enterMedicineNameEn')}
            />

            <FormField
              label={t('description')}
              name="description"
              type="textarea"
              defaultValue={editingItem?.description || ''}
              placeholder={t('enterMedicineDescription')}
              rows={4}
              helpText={t('medicineDescriptionHelp')}
            />

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
              {editingItem ? t('updateMedicine') : t('createMedicine')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}