function initAreaSelect(selectId, checkboxId, hiddenFieldId) {
    const $areasSelect = $(selectId)
    const $selectAllCheckbox = $(checkboxId)
    const $selectAllHidden = $(hiddenFieldId)

    if (!$areasSelect.length || !$selectAllCheckbox.length) return

    $areasSelect.select2({
        width: '100%',
        placeholder: 'Select areas',
        allowClear: true,
        multiple: true,
    })

    const totalAreas = $areasSelect
        .find('option')
        .filter((_, opt) => $(opt).val()?.trim()).length

    const validSelectedAreas = ($areasSelect.val() || []).filter((val) =>
        val?.trim()
    )

    if (validSelectedAreas.length === totalAreas && totalAreas > 0) {
        $selectAllCheckbox.prop('checked', true)
        $selectAllHidden.val('true')
    }

    $selectAllCheckbox.on('change', function () {
        if (this.checked) {
            const allIds = $areasSelect
                .find('option')
                .map((_, opt) => $(opt).val()?.trim())
                .get()
                .filter(Boolean)
            $areasSelect.val(allIds).trigger('change')
            $selectAllHidden.val('true')
        } else {
            $areasSelect.val([]).trigger('change')
            $selectAllHidden.val('false')
        }
    })

    $areasSelect.on('change', function () {
        const valid = ($(this).val() || []).filter((v) => v?.trim())
        if (valid.length === totalAreas) {
            $selectAllCheckbox.prop('checked', true)
            $selectAllHidden.val('true')
        } else {
            $selectAllCheckbox.prop('checked', false)
            $selectAllHidden.val('false')
        }
    })
}

// Usage
document.addEventListener('DOMContentLoaded', () => {
    initAreaSelect(
        '#category_areas',
        '#selectAllAreasCheckbox',
        '#selectAllAreasHidden'
    )
    initAreaSelect(
        '#fooditem_areas',
        '#selectAllAreasCheckbox',
        '#selectAllAreasHidden'
    )
})
