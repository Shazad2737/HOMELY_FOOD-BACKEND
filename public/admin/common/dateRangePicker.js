class DateRangePicker {
    constructor(options = {}) {
        this.options = {
            elementId: 'kt_daterangepicker_4',
            inputId: 'dateRangeInput',
            formId: 'periodFilterForm',
            defaultRange: 30, // days
            initialDateRange: null,
            onApply: null,
            opens: 'left',
            ...options,
        }

        this.start = null
        this.end = null
        this.init()
    }

    init() {
        if (this.options.initialDateRange) {
            const parts = this.options.initialDateRange.split(' to ')
            if (parts.length === 2) {
                this.start = moment(parts[0])
                this.end = moment(parts[1])
            } else {
                this.start = moment().subtract(
                    this.options.defaultRange - 1,
                    'days'
                )
                this.end = moment()
            }
        } else {
            this.start = moment().subtract(
                this.options.defaultRange - 1,
                'days'
            )
            this.end = moment()
        }

        this.initDateRangePicker()
    }

    initDateRangePicker() {
        const self = this
        const element = $(`#${this.options.elementId}`)

        if (!element.length) {
            console.error(`Element #${this.options.elementId} not found`)
            return
        }

        function cb(start, end) {
            $(`#${self.options.elementId} span`).html(
                start.format('MMMM D, YYYY') +
                    ' - ' +
                    end.format('MMMM D, YYYY')
            )

            const startDate = start.format('YYYY-MM-DD')
            const endDate = end.format('YYYY-MM-DD')

            $(`#${self.options.inputId}`).val(startDate + ' to ' + endDate)
        }

        element.daterangepicker(
            {
                startDate: this.start,
                endDate: this.end,
                showDropdowns: true,
                minYear: 2000,
                maxYear: parseInt(moment().format('YYYY'), 10) + 2,
                opens: this.options.opens,
                locale: {
                    format: 'YYYY-MM-DD',
                },
                ranges: {
                    Today: [moment().startOf('day'), moment().endOf('day')],
                    Yesterday: [
                        moment().subtract(1, 'days').startOf('day'),
                        moment().subtract(1, 'days').endOf('day'),
                    ],
                    'Last 7 Days': [
                        moment().subtract(6, 'days').startOf('day'),
                        moment().endOf('day'),
                    ],
                    'Last 30 Days': [
                        moment().subtract(29, 'days').startOf('day'),
                        moment().endOf('day'),
                    ],
                    'This Month': [
                        moment().startOf('month'),
                        moment().endOf('month'),
                    ],
                    'Last Month': [
                        moment().subtract(1, 'month').startOf('month'),
                        moment().subtract(1, 'month').endOf('month'),
                    ],
                },
            },
            cb
        )

        cb(this.start, this.end)

        element.on('apply.daterangepicker', function (ev, picker) {
            const startDate = picker.startDate.format('YYYY-MM-DD')
            const endDate = picker.endDate.format('YYYY-MM-DD')

            $(`#${self.options.inputId}`).val(startDate + ' to ' + endDate)

            if (typeof self.options.onApply === 'function') {
                self.options.onApply(startDate, endDate, picker)
            } else {
                const form = document.getElementById(self.options.formId)
                if (form) {
                    form.submit()
                }
            }
        })
    }

    static getGroupingType(dateRangeStr) {
        const parts = dateRangeStr.split(' to ')
        if (parts.length !== 2) return ''

        try {
            const startDate = new Date(parts[0])
            const endDate = new Date(parts[1])

            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime()))
                return ''

            const diffTime = Math.abs(endDate - startDate)
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

            if (diffDays <= 31) {
                return '(Grouped by day)'
            } else if (diffDays <= 365) {
                return '(Grouped by month)'
            } else {
                return '(Grouped by year)'
            }
        } catch (e) {
            console.error('Error calculating date difference:', e)
            return ''
        }
    }
}

window.DateRangePicker = DateRangePicker
