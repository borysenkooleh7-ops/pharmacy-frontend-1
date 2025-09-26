import { useEffect, useState, useMemo } from 'react'
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
    const [searchTerm, setSearchTerm] = useState('')
    const [actionFilter, setActionFilter] = useState<'all' | 'created' | 'updated'>('all')
    const [qualityFilter, setQualityFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'review'>('all')
    const [cityFilter, setCityFilter] = useState('all')

    const allPharmacies = completedSyncs.flatMap(sync =>
      (sync.result?.pharmacies || []).map(pharmacy => ({
        ...pharmacy,
        cityName: sync.cityName,
        syncResult: sync.result
      }))
    )

    if (allPharmacies.length === 0) {
      return null
    }

    // Get unique cities for filter dropdown
    const uniqueCities = Array.from(new Set(allPharmacies.map(p => p.cityName))).sort()

    // Filter pharmacies based on search and filters
    const filteredPharmacies = useMemo(() => {
      return allPharmacies.filter(pharmacy => {
        // Search filter
        const matchesSearch = searchTerm === '' ||
          pharmacy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pharmacy.google_place_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          pharmacy.cityName.toLowerCase().includes(searchTerm.toLowerCase())

        // Action filter
        const matchesAction = actionFilter === 'all' || pharmacy.action === actionFilter

        // Quality filter
        const reliability = pharmacy.reliability || 0
        const matchesQuality = qualityFilter === 'all' ||
          (qualityFilter === 'high' && reliability >= 80) ||
          (qualityFilter === 'medium' && reliability >= 60 && reliability < 80) ||
          (qualityFilter === 'low' && reliability < 60) ||
          (qualityFilter === 'review' && pharmacy.requiresReview)

        // City filter
        const matchesCity = cityFilter === 'all' || pharmacy.cityName === cityFilter

        return matchesSearch && matchesAction && matchesQuality && matchesCity
      })
    }, [allPharmacies, searchTerm, actionFilter, qualityFilter, cityFilter])

    // Calculate comprehensive statistics for filtered data
    const totalPharmacies = filteredPharmacies.length
    const createdCount = filteredPharmacies.filter(p => p.action === 'created').length
    const updatedCount = filteredPharmacies.filter(p => p.action === 'updated').length
    const highReliabilityCount = filteredPharmacies.filter(p => (p.reliability || 0) >= 80).length
    const requiresReviewCount = filteredPharmacies.filter(p => p.requiresReview).length
    const avgReliability = totalPharmacies > 0 ?
      Math.round(filteredPharmacies.reduce((sum, p) => sum + (p.reliability || 0), 0) / totalPharmacies) : 0

    return (
      <div className="mt-8">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  🏥 Comprehensive Pharmacy Data
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {totalPharmacies} pharmacies
                  </span>
                  {totalPharmacies < allPharmacies.length && (
                    <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                      filtered from {allPharmacies.length}
                    </span>
                  )}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Complete details of all pharmacies retrieved from enhanced Google Places API search
                </p>
              </div>
              <div className="text-right text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-green-600">{createdCount}</div>
                    <div className="text-xs">New</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-blue-600">{updatedCount}</div>
                    <div className="text-xs">Updated</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">{avgReliability}%</div>
                    <div className="text-xs">Avg Quality</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter Controls */}
            <div className="mt-4 bg-gray-100 p-4 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Search Pharmacies</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Name, Place ID, or city..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Action Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value as 'all' | 'created' | 'updated')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Actions</option>
                    <option value="created">New Only ({allPharmacies.filter(p => p.action === 'created').length})</option>
                    <option value="updated">Updated Only ({allPharmacies.filter(p => p.action === 'updated').length})</option>
                  </select>
                </div>

                {/* Quality Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Data Quality</label>
                  <select
                    value={qualityFilter}
                    onChange={(e) => setQualityFilter(e.target.value as 'all' | 'high' | 'medium' | 'low' | 'review')}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Quality</option>
                    <option value="high">High (≥80%) ({allPharmacies.filter(p => (p.reliability || 0) >= 80).length})</option>
                    <option value="medium">Medium (60-79%) ({allPharmacies.filter(p => (p.reliability || 0) >= 60 && (p.reliability || 0) < 80).length})</option>
                    <option value="low">Low ({'<60%'}) ({allPharmacies.filter(p => (p.reliability || 0) < 60).length})</option>
                    <option value="review">Needs Review ({allPharmacies.filter(p => p.requiresReview).length})</option>
                  </select>
                </div>

                {/* City Filter */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">City</label>
                  <select
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Cities</option>
                    {uniqueCities.map(city => (
                      <option key={city} value={city}>
                        {city} ({allPharmacies.filter(p => p.cityName === city).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quick Filter Buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setActionFilter('all')
                    setQualityFilter('all')
                    setCityFilter('all')
                  }}
                  className="px-3 py-1 text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => setQualityFilter('review')}
                  className="px-3 py-1 text-xs bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-full transition-colors"
                >
                  Show Review Required ({allPharmacies.filter(p => p.requiresReview).length})
                </button>
                <button
                  onClick={() => setQualityFilter('high')}
                  className="px-3 py-1 text-xs bg-green-100 hover:bg-green-200 text-green-800 rounded-full transition-colors"
                >
                  Show High Quality ({allPharmacies.filter(p => (p.reliability || 0) >= 80).length})
                </button>
                <button
                  onClick={() => setActionFilter('created')}
                  className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded-full transition-colors"
                >
                  Show New Only ({allPharmacies.filter(p => p.action === 'created').length})
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm font-medium text-green-800">High Quality</div>
                <div className="text-2xl font-bold text-green-600">{highReliabilityCount}</div>
                <div className="text-xs text-green-600">≥80% reliability</div>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <div className="text-sm font-medium text-yellow-800">Needs Review</div>
                <div className="text-2xl font-bold text-yellow-600">{requiresReviewCount}</div>
                <div className="text-xs text-yellow-600">Manual check required</div>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="text-sm font-medium text-blue-800">Google Verified</div>
                <div className="text-2xl font-bold text-blue-600">
                  {allPharmacies.filter(p => p.google_place_id).length}
                </div>
                <div className="text-xs text-blue-600">Has Place ID</div>
              </div>
              <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                <div className="text-sm font-medium text-indigo-800">Duplicates Found</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {completedSyncs.reduce((acc, sync) => acc + (sync.result?.duplicates?.length || 0), 0)}
                </div>
                <div className="text-xs text-indigo-600">Auto-merged</div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-screen">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID & Action
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-48">
                    Pharmacy Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    City & Location
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quality & Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Match & Integration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Search Metrics
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changes & Updates
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPharmacies.map((pharmacy, index) => {

                  const reliabilityColor = (reliability: number = 0) => {
                    if (reliability >= 80) return 'text-green-600 bg-green-100'
                    if (reliability >= 60) return 'text-yellow-600 bg-yellow-100'
                    if (reliability >= 40) return 'text-orange-600 bg-orange-100'
                    return 'text-red-600 bg-red-100'
                  }

                  return (
                    <tr key={`${pharmacy.id}-${index}`} className="hover:bg-gray-50">
                      {/* ID & Action */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">#{pharmacy.id}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                          pharmacy.action === 'created'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {pharmacy.action === 'created' ? 'New' : 'Updated'}
                        </span>
                      </td>

                      {/* Pharmacy Details */}
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900 line-clamp-2" title={pharmacy.name}>
                          {pharmacy.name}
                        </div>
                        {pharmacy.google_place_id && (
                          <div className="text-xs text-gray-500 font-mono mt-1 truncate" title={pharmacy.google_place_id}>
                            🌍 {pharmacy.google_place_id.substring(0, 20)}...
                          </div>
                        )}
                        {pharmacy.requiresReview && (
                          <div className="flex items-center mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                              ⚠️ Review Required
                            </span>
                          </div>
                        )}
                      </td>

                      {/* City & Location */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 font-medium">
                          {pharmacy.cityName || 'Unknown'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          📍 From: {pharmacy.syncResult?.searchStats?.coverageRadiiUsed?.length || 1} search radii
                        </div>
                      </td>

                      {/* Quality & Status */}
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          <div className={`text-xs px-2 py-1 rounded-full font-medium ${reliabilityColor(pharmacy.reliability || 0)}`}>
                            {pharmacy.reliability || 0}% quality
                          </div>
                          {pharmacy.syncResult?.quality && (
                            <div className="text-xs text-gray-500">
                              Avg: {pharmacy.syncResult.quality.avgReliability}%
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Match & Integration */}
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {pharmacy.matchMethod ? (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-indigo-100 text-indigo-800">
                              🔗 {pharmacy.matchMethod.replace('_', ' ')}
                            </span>
                          ) : (
                            <span className="text-green-600 text-xs">✨ New pharmacy</span>
                          )}
                        </div>
                        {pharmacy.changes && pharmacy.changes.length > 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            📝 {pharmacy.changes.length} field(s) updated
                          </div>
                        )}
                      </td>

                      {/* Search Metrics */}
                      <td className="px-4 py-4">
                        {pharmacy.syncResult?.searchStats && (
                          <div className="text-xs space-y-1 text-gray-600">
                            <div className="flex items-center">
                              <span className="text-blue-600">🔍</span>
                              <span className="ml-1">{pharmacy.syncResult.searchStats.searchStrategiesUsed} strategies</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-green-600">📊</span>
                              <span className="ml-1">{pharmacy.syncResult.searchStats.apiCallsSuccessful}/{pharmacy.syncResult.searchStats.apiCallsTotal} API calls</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-purple-600">⏱️</span>
                              <span className="ml-1">{pharmacy.syncResult.searchStats.processingTimeSeconds}s</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-orange-600">🎯</span>
                              <span className="ml-1">{pharmacy.syncResult.searchStats.accuracyRate}% accuracy</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Changes & Updates */}
                      <td className="px-4 py-4">
                        {pharmacy.changes && pharmacy.changes.length > 0 ? (
                          <div className="space-y-1">
                            {pharmacy.changes.slice(0, 3).map((change, idx) => (
                              <div key={idx} className="text-xs text-gray-600">
                                <span className="font-medium text-gray-700">{change.field}:</span>
                                <div className="text-red-500 truncate max-w-20" title={String(change.old)}>
                                  - {String(change.old).substring(0, 15)}...
                                </div>
                                <div className="text-green-500 truncate max-w-20" title={String(change.new)}>
                                  + {String(change.new).substring(0, 15)}...
                                </div>
                              </div>
                            ))}
                            {pharmacy.changes.length > 3 && (
                              <div className="text-xs text-gray-400">
                                +{pharmacy.changes.length - 3} more changes
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-xs text-gray-400">No changes recorded</div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Enhanced Footer with Comprehensive Statistics */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-gray-600">
              <div>
                <div className="font-medium text-gray-900 mb-1">Search Coverage</div>
                <div>• Total search strategies: {completedSyncs.reduce((acc, s) => acc + (s.result?.searchStats?.searchStrategiesUsed || 0), 0)}</div>
                <div>• API calls made: {completedSyncs.reduce((acc, s) => acc + (s.result?.searchStats?.apiCallsTotal || 0), 0)}</div>
                <div>• Processing time: {completedSyncs.reduce((acc, s) => acc + (s.result?.syncDuration || 0), 0)}s total</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Quality Metrics</div>
                <div>• Average reliability: {avgReliability}%</div>
                <div>• High quality (≥80%): {highReliabilityCount}/{totalPharmacies}</div>
                <div>• Requires review: {requiresReviewCount}/{totalPharmacies}</div>
              </div>
              <div>
                <div className="font-medium text-gray-900 mb-1">Integration Results</div>
                <div>• New pharmacies: {createdCount}</div>
                <div>• Updated existing: {updatedCount}</div>
                <div>• Duplicates merged: {completedSyncs.reduce((acc, s) => acc + (s.result?.coverage?.duplicatesDetected || 0), 0)}</div>
              </div>
            </div>
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
        {/* Enhanced Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{completedSyncs.length + failedSyncs.length}</div>
            <div className="text-sm text-gray-600">Cities Processed</div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(((completedSyncs.length / (completedSyncs.length + failedSyncs.length)) * 100) || 0)}% success rate
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{completedSyncs.length}</div>
            <div className="text-sm text-gray-600">Successful Syncs</div>
            <div className="text-xs text-gray-500 mt-1">
              {completedSyncs.reduce((acc, s) => acc + (s.result?.syncDuration || 0), 0)}s total time
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-indigo-600">
              {completedSyncs.reduce((acc, sync) => acc + (sync.result?.created || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">New Pharmacies</div>
            <div className="text-xs text-gray-500 mt-1">
              + {completedSyncs.reduce((acc, sync) => acc + (sync.result?.updated || 0), 0)} updated
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">
              {Math.round(completedSyncs.reduce((acc, sync) => acc + (sync.result?.quality?.avgReliability || 0), 0) / (completedSyncs.length || 1))}%
            </div>
            <div className="text-sm text-gray-600">Avg Quality</div>
            <div className="text-xs text-gray-500 mt-1">
              {completedSyncs.reduce((acc, sync) => acc + (sync.result?.quality?.highQuality || 0), 0)} high quality
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-orange-600">
              {completedSyncs.reduce((acc, sync) => acc + (sync.result?.searchStats?.apiCallsTotal || 0), 0)}
            </div>
            <div className="text-sm text-gray-600">API Calls Made</div>
            <div className="text-xs text-gray-500 mt-1">
              {completedSyncs.reduce((acc, sync) => acc + (sync.result?.searchStats?.searchStrategiesUsed || 0), 0)} strategies
            </div>
          </div>
        </div>

        {/* Enhanced Completed Syncs */}
        {completedSyncs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-medium text-green-800 mb-3 flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              🎯 Comprehensive Sync Results ({completedSyncs.length} cities)
            </h4>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {completedSyncs.map((sync, index) => (
                <div key={index} className="bg-white p-4 rounded-lg border border-green-200 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-green-900">{sync.cityName}</span>
                      <span className="ml-2 text-xs text-green-600">
                        ⏱️ {sync.result?.syncDuration || 0}s
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-800">
                        {sync.result?.created || 0} new • {sync.result?.updated || 0} updated
                      </div>
                      <div className="text-xs text-green-600">
                        {sync.result?.processed || 0} total processed
                      </div>
                    </div>
                  </div>

                  {/* Enhanced metrics from comprehensive backend */}
                  {sync.result?.searchStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-xs">
                      <div className="bg-blue-50 p-2 rounded border border-blue-200">
                        <div className="font-medium text-blue-800">Search Coverage</div>
                        <div className="text-blue-600">
                          🔍 {sync.result.searchStats.searchStrategiesUsed} strategies
                        </div>
                        <div className="text-blue-600">
                          📊 {sync.result.searchStats.apiCallsSuccessful}/{sync.result.searchStats.apiCallsTotal} API calls
                        </div>
                      </div>
                      <div className="bg-purple-50 p-2 rounded border border-purple-200">
                        <div className="font-medium text-purple-800">Data Quality</div>
                        <div className="text-purple-600">
                          ⭐ {sync.result.searchStats.avgReliability}% avg quality
                        </div>
                        <div className="text-purple-600">
                          🏆 {sync.result.searchStats.highQuality} high quality
                        </div>
                      </div>
                      <div className="bg-orange-50 p-2 rounded border border-orange-200">
                        <div className="font-medium text-orange-800">Coverage</div>
                        <div className="text-orange-600">
                          🎯 {sync.result.searchStats.accuracyRate}% accuracy
                        </div>
                        <div className="text-orange-600">
                          📍 {sync.result.searchStats.coverageRadiiUsed?.length || 1} radii used
                        </div>
                      </div>
                      <div className="bg-indigo-50 p-2 rounded border border-indigo-200">
                        <div className="font-medium text-indigo-800">Integration</div>
                        {sync.result.coverage && (
                          <>
                            <div className="text-indigo-600">
                              📈 {sync.result.coverage.improvement} improvement
                            </div>
                            <div className="text-indigo-600">
                              🔄 {sync.result.coverage.duplicatesDetected} duplicates merged
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Quality indicators */}
                  {sync.result?.quality && (
                    <div className="mt-3 flex items-center justify-between text-xs">
                      <div className="flex space-x-3">
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">
                          🥇 {sync.result.quality.highQuality} high quality (≥80%)
                        </span>
                        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                          🥈 {sync.result.quality.mediumQuality} medium (60-79%)
                        </span>
                        {sync.result.quality.requiresReview > 0 && (
                          <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">
                            ⚠️ {sync.result.quality.requiresReview} need review
                          </span>
                        )}
                      </div>
                      <span className="text-gray-600">
                        🌍 {sync.result.quality.withGoogleId} with Google Place ID
                      </span>
                    </div>
                  )}

                  {/* Recommendations if any */}
                  {sync.result?.recommendations && sync.result.recommendations.length > 0 && (
                    <div className="mt-2 text-xs text-green-700">
                      💡 {sync.result.recommendations[0]}
                      {sync.result.recommendations.length > 1 && ` (+${sync.result.recommendations.length - 1} more)`}
                    </div>
                  )}
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