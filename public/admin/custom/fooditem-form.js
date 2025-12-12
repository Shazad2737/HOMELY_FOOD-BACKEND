;(() => {
    document.addEventListener('DOMContentLoaded', () => {
        /** ---------------------------------
         * Read Recurring Weekly Holidays
         * ---------------------------------- */
        let weeklyHolidays = []
        const holidayEl = document.getElementById('weeklyHolidayData')

        if (holidayEl?.dataset?.holidays) {
            try {
                weeklyHolidays = JSON.parse(holidayEl.dataset.holidays)
            } catch (err) {
                console.error('Holiday JSON parse error:', err)
            }
        }

        /** ---------------------------------
         * Select Working Days Button
         * ---------------------------------- */
        const button = document.getElementById('selectWorkingDaysBtn')
        const dayCheckboxes = document.querySelectorAll(
            'input[name="availableDays[]"]'
        )

        button?.addEventListener('click', () => {
            dayCheckboxes.forEach((cb) => {
                const isHoliday = weeklyHolidays.includes(cb.value)
                cb.checked = !isHoliday // Working days only
            })
        })

        /** ---------------------------------
         * Select2 AJAX – Plans filtered by Category
         * ---------------------------------- */
        const planSelect = $('#fooditem_plans')
        const categorySelect = $('select[name="categoryId"]')

        if (planSelect.length && categorySelect.length) {
            const selectedIds = JSON.parse(
                planSelect.attr('data-selected-id') || '[]'
            )

            function loadPlans(categoryId) {
                planSelect.empty().trigger('change')

                if (!categoryId) return

                $.get(
                    `/admin/fooditem/plans/by-category?categoryId=${categoryId}`,
                    (res) => {
                        if (!res.success) return

                        res.plans.forEach((plan) => {
                            const isSelected = selectedIds.includes(plan.id)
                            const option = new Option(
                                plan.name,
                                plan.id,
                                isSelected,
                                isSelected
                            )
                            planSelect.append(option)
                        })

                        planSelect.trigger('change')
                    }
                )
            }

            categorySelect.on('change', function () {
                loadPlans($(this).val())
            })

            if (selectedIds.length) {
                loadPlans(categorySelect.val())
            }

            planSelect.select2()
        }
    })
})()
