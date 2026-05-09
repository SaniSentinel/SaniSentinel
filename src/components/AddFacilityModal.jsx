import React from 'react'
import AddFacilityForm from './AddFacilityForm'

const AddFacilityModal = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null

  const handleSuccess = (newFacility) => {
    if (onSuccess) {
      onSuccess(newFacility)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl">
          <AddFacilityForm 
            onClose={onClose}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  )
}

export default AddFacilityModal