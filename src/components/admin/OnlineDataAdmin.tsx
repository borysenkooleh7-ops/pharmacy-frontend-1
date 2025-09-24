import { useEffect } from 'react'
import { useAppSelector, useAppDispatch } from '../../hooks/redux'
import { useTranslation } from '../../translations'
import {
  fetchSyncableCities,
  syncCityData,
  startBulkSync,
  stopBulkSync,
  moveToNextCity,
  clearSyncResults,
  clearError
} from '../../store/slices/onlineDataSlice'

interface OnlineDataAdminProps {
  onMessage: (message: string) => void
}

export default function OnlineDataAdmin({ onMessage }: OnlineDataAdminProps) {
  const dispatch = useAppDispatch()
  const { language } = useAppSelector(state => state.ui)
  const t = useTranslation(language)
  const {
    cities,
    citiesLoading,
    syncInProgress,
    currentSync,
    syncQueue,
    completedSyncs,
    failedSyncs,
    totalCities,
    processedCities,
    overallProgress,
    error
  } = useAppSelector(state => state.onlineData)

  useEffect(() => {
    dispatch(fetchSyncableCities())
  }, [dispatch])

  useEffect(() => {
    if (error) {
      onMessage(`Error: ${error}`)
    }
  }, [error, onMessage])

  useEffect(() => {
    if (syncInProgress && currentSync && currentSync.status === 'pending') {
      // Auto-start sync for the current city
      const timer = setTimeout(() => {
        if (currentSync) {
          dispatch(syncCityData(currentSync.citySlug))
            .unwrap()
            .then(() => {
              // Sync completed successfully, move to next city
              setTimeout(() => {
                dispatch(moveToNextCity())
              }, 1000)
            })
            .catch(() => {
              // Sync failed, move to next city (retry logic is handled in moveToNextCity)
              setTimeout(() => {
                dispatch(moveToNextCity())
              }, 1000)
            })
        }
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [dispatch, syncInProgress, currentSync])

  useEffect(() => {
    // Show completion message when sync is done
    if (!syncInProgress && totalCities > 0 && processedCities === totalCities) {
      const message = t('syncCompleted').replace('{completed}', completedSyncs.length.toString()).replace('{failed}', failedSyncs.length.toString())
      onMessage(message)
    }
  }, [syncInProgress, totalCities, processedCities, completedSyncs.length, failedSyncs.length, onMessage])

  const handleStartBulkSync = () => {
    if (cities.length === 0) {
      onMessage(t('noCitiesAvailableForSync'))
      return
    }

    const citySlugs = cities.map(city => city.slug)
    dispatch(startBulkSync(citySlugs))
    onMessage('Starting bulk sync for all cities...')
  }

  const handleStopSync = () => {
    dispatch(stopBulkSync())
    onMessage(t('syncStoppedByUser'))
  }

  const handleClearResults = () => {
    dispatch(clearSyncResults())
    onMessage(t('syncResultsCleared'))
  }

  const handleClearError = () => {
    dispatch(clearError())
  }

  const renderSyncStatus = () => {
    if (!syncInProgress && totalCities === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            No sync in progress
          </div>
          <p className="text-sm text-gray-600">
            {t('clickToStartSyncing')}
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        {/* Overall Progress */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-blue-700">Overall Progress</span>
            <span className="text-sm text-blue-600">{overallProgress}%</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            ></div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            {processedCities} of {totalCities} cities processed
          </div>
        </div>

        {/* Current Sync */}
        {currentSync && (
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">
                  {currentSync.cityName}
                </h4>
                <p className="text-sm text-gray-500 capitalize">
                  Status: {currentSync.status}
                  {currentSync.retryCount > 0 && ` (Retry ${currentSync.retryCount}/${currentSync.maxRetries})`}
                </p>
              </div>
              <div className="flex items-center">
                {currentSync.status === 'syncing' && (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                )}
                {currentSync.status === 'success' && (
                  <div className="text-green-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {currentSync.status === 'error' && (
                  <div className="text-red-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            {currentSync.error && (
              <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                {currentSync.error}
              </div>
            )}
            {currentSync.result && (
              <div className="mt-2 text-sm text-green-600 bg-green-50 p-2 rounded">
                Processed {currentSync.result.processed} pharmacies: {currentSync.result.created} created, {currentSync.result.updated} updated
              </div>
            )}
          </div>
        )}

        {/* Queue */}
        {syncQueue.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Remaining Cities ({syncQueue.length})</h4>
            <div className="flex flex-wrap gap-2">
              {syncQueue.slice(0, 10).map(citySlug => {
                const city = cities.find(c => c.slug === citySlug)
                return (
                  <span key={citySlug} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                    {city?.name_en || citySlug}
                  </span>
                )
              })}
              {syncQueue.length > 10 && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-300 text-gray-600">
                  +{syncQueue.length - 10} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderPharmacyDataTable = () => {
    const allPharmacies = completedSyncs.flatMap(sync =>
      sync.result?.pharmacies || []
    )

    if (allPharmacies.length === 0) {
      return null
    }

    return (
      <div className="mt-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <h4 className="text-lg font-semibold text-gray-900">
              Fetched Pharmacy Data ({allPharmacies.length} pharmacies)
            </h4>
            <p className="text-sm text-gray-600 mt-1">
              Complete details of all pharmacies retrieved from Google Places API
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 max-h-screen overflow-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Place ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allPharmacies.map((pharmacy, index) => {
                  const sync = completedSyncs.find(s =>
                    s.result?.pharmacies.some(p => p.id === pharmacy.id)
                  )
                  return (
                    <tr key={`${pharmacy.id}-${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {pharmacy.id}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div className="max-w-xs" title={pharmacy.name}>
                          <div className="font-medium">{pharmacy.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                        {sync?.cityName || t('unknown')}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          pharmacy.action === 'created'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {pharmacy.action === 'created' ? t('new') : t('updated')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        <div className="max-w-xs font-mono text-xs break-all" title={pharmacy.google_place_id}>
                          {pharmacy.google_place_id || 'N/A'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {sync?.result && 'searchSummary' in sync.result && sync.result.searchSummary && (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center">
                              <span className="text-blue-600">🔍</span>
                              <span className="ml-1">{sync.result.searchSummary.strategiesUsed} strategies</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-600">📍</span>
                              <span className="ml-1">{sync.result.searchSummary.uniquePlacesFound} places</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-purple-600">⏱️</span>
                              <span className="ml-1">{sync.result.searchSummary.processingTimeSeconds}s</span>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderResults = () => {
    if (completedSyncs.length === 0 && failedSyncs.length === 0) {
      return null
    }

    return (
      <div className="mt-6 space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{completedSyncs.length + failedSyncs.length}</div>
            <div className="text-sm text-gray-600">Cities Processed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{completedSyncs.length}</div>
            <div className="text-sm text-gray-600">Successful</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{failedSyncs.length}</div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {completedSyncs.reduce((acc, sync) => acc + (sync.result?.created || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">New Pharmacies</div>
          </div>
        </div>

        {/* Completed Syncs */}
        {completedSyncs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Successful Syncs ({completedSyncs.length})
            </h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {completedSyncs.map((sync, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded border">
                  <div>
                    <span className="font-medium text-green-800">{sync.cityName}</span>
                    {sync.result && 'searchSummary' in sync.result && sync.result.searchSummary && (
                      <div className="text-xs text-green-600 mt-1">
                        📋 {sync.result.searchSummary.strategiesUsed} search strategies •
                        🔍 {sync.result.searchSummary.uniquePlacesFound} places found •
                        ⏱️ {sync.result.searchSummary.processingTimeSeconds}s
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-green-700">
                      {sync.result?.created || 0}C / {sync.result?.updated || 0}U
                    </div>
                    <div className="text-xs text-green-600">
                      {sync.result?.processed || 0} total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Failed Syncs */}
        {failedSyncs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-medium text-red-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              Failed Syncs ({failedSyncs.length})
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {failedSyncs.map((sync, index) => (
                <div key={index} className="p-3 bg-red-50 rounded border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-800">{sync.cityName}</span>
                    <span className="text-xs text-red-600">
                      Retries: {sync.retryCount}/{sync.maxRetries}
                    </span>
                  </div>
                  {sync.error && (
                    <div className="text-xs text-red-600 mt-1 truncate">{sync.error}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Online Pharmacy Data</h3>
          <p className="text-sm text-gray-600">
            Sync pharmacy data from Google Places API for all cities in Montenegro
          </p>
        </div>
        <div className="flex gap-2">
          {!syncInProgress ? (
            <>
              <button
                onClick={handleStartBulkSync}
                disabled={citiesLoading || cities.length === 0}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors font-medium"
              >
                {citiesLoading ? t('loading') : t('receiveOnlinePharmaciesData')}
              </button>
              {(completedSyncs.length > 0 || failedSyncs.length > 0) && (
                <button
                  onClick={handleClearResults}
                  className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Clear Results
                </button>
              )}
            </>
          ) : (
            <button
              onClick={handleStopSync}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
            >
              Stop Sync
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={handleClearError}
            className="text-red-500 hover:text-red-700 ml-4"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Cities Info */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">Available Cities</span>
          <span className="text-sm text-gray-600">{cities.length} cities</span>
        </div>
        {cities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {cities.slice(0, 8).map(city => (
              <span key={city.id} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                {city.name_en}
              </span>
            ))}
            {cities.length > 8 && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">
                +{cities.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sync Status */}
      {renderSyncStatus()}

      {/* Results */}
      {renderResults()}

      {/* Detailed Pharmacy Data Table */}
      {renderPharmacyDataTable()}
    </div>
  )
}