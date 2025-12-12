;(function () {
    'use strict'

    const holidayTypeSelect = $('#holidayType')
    const holidayDateInput = $('#holidayDate')
    const dayOfWeekSelect = $('#dayOfWeek')
    let holidayDatePicker = null

    // Initialize Flatpickr for holiday date
    function initializeDatePicker() {
        if (holidayDatePicker) {
            holidayDatePicker.destroy()
        }

        holidayDatePicker = flatpickr('#holidayDate', {
            dateFormat: 'Y-m-d',
            allowInput: false,
            minDate: 'today',
        })
    }

    // Toggle fields based on holiday type
    function toggleFields() {
        const selectedType = holidayTypeSelect.val()

        if (selectedType === 'SPECIFIC_DATE') {
            // Show date field, hide day of week
            holidayDateInput.closest('.card').show()
            dayOfWeekSelect.closest('.card').hide()

            // Make date required, day of week optional
            holidayDateInput.attr('required', true)
            dayOfWeekSelect.removeAttr('required')
            dayOfWeekSelect.val('').trigger('change')

            // Initialize date picker
            initializeDatePicker()
        } else if (selectedType === 'RECURRING_WEEKLY') {
            // Hide date field, show day of week
            holidayDateInput.closest('.card').hide()
            dayOfWeekSelect.closest('.card').show()

            // Make day of week required, date optional
            dayOfWeekSelect.attr('required', true)
            holidayDateInput.removeAttr('required')
            holidayDateInput.val('')

            // Destroy date picker
            if (holidayDatePicker) {
                holidayDatePicker.destroy()
                holidayDatePicker = null
            }
        } else {
            // No type selected, hide both
            holidayDateInput.closest('.card').hide()
            dayOfWeekSelect.closest('.card').hide()
            holidayDateInput.removeAttr('required')
            dayOfWeekSelect.removeAttr('required')

            // Destroy date picker
            if (holidayDatePicker) {
                holidayDatePicker.destroy()
                holidayDatePicker = null
            }
        }
    }

    // Initialize on page load
    holidayTypeSelect.on('change', toggleFields)

    // Trigger initial state
    toggleFields()
})()
