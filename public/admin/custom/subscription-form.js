;(function () {
    const customerSelect = $('#customer_select')
    const categorySelect = $('select[name="categoryId"]')
    const planSelect = $('#plan_select')

    // Initialize Flatpickr for date pickers
    const startDatePicker = flatpickr('#start_date_picker', {
        dateFormat: 'Y-m-d',
        allowInput: false,
        onChange: function (selectedDates, dateStr, instance) {
            // Update end date picker's minDate
            if (selectedDates.length > 0 && endDatePicker) {
                endDatePicker.set('minDate', selectedDates[0])
            }
        },
    })

    const endDatePicker = flatpickr('#end_date_picker', {
        dateFormat: 'Y-m-d',
        allowInput: false,
        onChange: function (selectedDates, dateStr, instance) {
            // Update start date picker's maxDate
            if (selectedDates.length > 0 && startDatePicker) {
                startDatePicker.set('maxDate', selectedDates[0])
            }
        },
    })

    // Set initial minDate for end date if start date has value
    const startDateValue = $('#start_date_picker').val()
    if (startDateValue && endDatePicker) {
        endDatePicker.set('minDate', startDateValue)
    }

    // Set initial maxDate for start date if end date has value
    const endDateValue = $('#end_date_picker').val()
    if (endDateValue && startDatePicker) {
        startDatePicker.set('maxDate', endDateValue)
    }

    // Load customers via AJAX on page load
    if (customerSelect.length) {
        const selectedCustomerId = customerSelect.attr('data-selected-id')

        fetch('/admin/subscription/customers')
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    data.customers.forEach((customer) => {
                        const displayText = `${
                            customer.customerCode
                        } • ${customer.name.toUpperCase()} — ${customer.mobile}`
                        const option = new Option(
                            displayText,
                            customer.id,
                            false,
                            customer.id === selectedCustomerId
                        )
                        customerSelect.append(option)
                    })
                    customerSelect.trigger('change')

                    // clear selected id after first use
                    if (selectedCustomerId) {
                        customerSelect.removeAttr('data-selected-id')
                    }
                }
            })
            .catch((err) => console.error('Customer fetch error:', err))
    }

    if (categorySelect.length && planSelect.length) {
        categorySelect.on('change', function () {
            const categoryId = $(this).val()
            const selectedPlanId = planSelect.attr('data-selected-id')

            // Reset plan options
            planSelect.find('option:not(:first)').remove()

            if (categoryId) {
                fetch(
                    `/admin/subscription/plans/by-category?categoryId=${categoryId}`
                )
                    .then((res) => res.json())
                    .then((data) => {
                        if (data.success) {
                            data.plans.forEach((plan) => {
                                const option = new Option(
                                    plan.name,
                                    plan.id,
                                    false,
                                    plan.id === selectedPlanId
                                )
                                planSelect.append(option)
                            })
                            planSelect.trigger('change')

                            // clear selected id after first use
                            if (selectedPlanId) {
                                planSelect.removeAttr('data-selected-id')
                            }
                        }
                    })
                    .catch((err) => console.error('Plan fetch error:', err))
            } else {
                // if no category chosen, just reset
                planSelect.trigger('change')
            }
        })

        // Auto-run when editing a subscription
        const selectedPlanId = planSelect.attr('data-selected-id')
        if (selectedPlanId) {
            categorySelect.trigger('change')
        }
    }
})()
